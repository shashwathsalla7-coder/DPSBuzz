import {
  createGameSession,
  getRawGameSession,
  sanitizeGameSession,
  acceptGameInvite,
  selectSecretCricketer,
  askQuestion,
  answerQuestion,
  submitGuess,
  requestRematch,
  getCricketLeaderboard,
  getCricketMatchHistory,
} from '../src/lib/cricketGameStore.ts';
import { getCricketerById } from '../src/data/cricketers.ts';

async function runCricketGameTests() {
  console.log('🏏 [TEST SUITE] Starting DPSBuzz Guess the Cricketer Engine Verification...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    const player1 = {
      username: 'arjun_8a',
      fullName: 'Arjun Reddy',
      avatar: null,
    };

    const player2 = {
      username: 'priya_7b',
      fullName: 'Priya Sharma',
      avatar: null,
    };

    const chatId = 'arjun_8a__priya_7b';

    // TEST 1: Create Game Session
    console.log('--- Test 1: Game Challenge Creation ---');
    const session = await createGameSession(player1, player2, chatId);
    assert(session.gameId.startsWith('cricket_'), 'Generated valid gameId');
    assert(session.status === 'waiting_invite', 'Initial session status is waiting_invite');
    assert(session.player1.username === 'arjun_8a', 'Player 1 is correctly assigned');
    assert(session.player2.username === 'priya_7b', 'Player 2 is correctly assigned');

    // TEST 2: Accept Challenge
    console.log('\n--- Test 2: Accept Challenge ---');
    const accepted = await acceptGameInvite(session.gameId, 'priya_7b');
    assert(accepted?.status === 'selecting', 'Game status transitioned to selecting');

    // TEST 3: Secret Cricketer Selection & Anti-Cheat Sanitization
    console.log('\n--- Test 3: Secret Selection & Server-Side Security Isolation ---');
    const sel1 = await selectSecretCricketer(session.gameId, 'arjun_8a', 'virat-kohli');
    assert(sel1.success === true, 'Player 1 successfully locked in secret cricketer');
    assert(sel1.session?.player1.hasSelected === true, 'Player 1 hasSelected marked true');
    assert(sel1.session?.status === 'selecting', 'Game remains in selecting until Player 2 selects');

    // SECURITY CHECK: Sanitized output for Player 2 MUST NOT contain Player 1's secret!
    const p2ViewBefore = sanitizeGameSession(sel1.session!, 'priya_7b');
    assert(
      p2ViewBefore.player1.selectedCricketerId === null,
      'SECURITY CONFIRMED: Player 2 network state CANNOT inspect Player 1 cricketer ID'
    );
    assert(
      p2ViewBefore.revealedPlayer1Cricketer === null,
      'SECURITY CONFIRMED: Player 1 revealedCricketer is null for Player 2'
    );

    // Player 1's view of their own secret
    const p1ViewOwn = sanitizeGameSession(sel1.session!, 'arjun_8a');
    assert(
      p1ViewOwn.player1.selectedCricketerId === 'virat-kohli',
      'Player 1 can see their own locked-in cricketer'
    );

    // Player 2 selects their cricketer
    const sel2 = await selectSecretCricketer(session.gameId, 'priya_7b', 'jasprit-bumrah');
    assert(sel2.success === true, 'Player 2 successfully locked in secret cricketer');
    assert(sel2.session?.status === 'in_progress', 'Match transitioned to in_progress after both selected');
    assert(sel2.session?.currentTurn === 'arjun_8a', 'Player 1 starts Turn 1');

    // Double check mutual secret isolation during active gameplay
    const p1ViewGame = sanitizeGameSession(sel2.session!, 'arjun_8a');
    const p2ViewGame = sanitizeGameSession(sel2.session!, 'priya_7b');
    assert(
      p1ViewGame.player2.selectedCricketerId === null,
      'SECURITY CONFIRMED: Player 1 CANNOT inspect Player 2 secret during match'
    );
    assert(
      p2ViewGame.player1.selectedCricketerId === null,
      'SECURITY CONFIRMED: Player 2 CANNOT inspect Player 1 secret during match'
    );

    // TEST 4: Question & Answer Alternation
    console.log('\n--- Test 4: Questions & Deductions ---');
    const askRes = await askQuestion(session.gameId, 'arjun_8a', 'Is your cricketer a bowler?');
    assert(askRes.success === true, 'Player 1 asked a valid Yes/No question');
    assert(askRes.session?.turnState === 'awaiting_answer', 'turnState is awaiting_answer');
    assert(askRes.session?.activeQuestion?.askedBy === 'arjun_8a', 'activeQuestion recorded correctly');

    // Player 1 cannot answer their own question
    const selfAns = await answerQuestion(session.gameId, 'arjun_8a', 'yes');
    assert(selfAns.success === false, 'Blocked player from answering their own question');

    // Player 2 answers honestly (Jasprit Bumrah is a bowler -> yes)
    const ansRes = await answerQuestion(session.gameId, 'priya_7b', 'yes');
    assert(ansRes.success === true, 'Player 2 submitted answer');
    assert(ansRes.session?.turnState === 'ask_or_guess', 'turnState returned to ask_or_guess');
    assert(ansRes.session?.currentTurn === 'priya_7b', 'Turn passed to Player 2 after answering');

    // TEST 5: Incorrect Guess Behavior
    console.log('\n--- Test 5: Incorrect Guess Protection & Penalty ---');
    // Player 2 guesses Rohit Sharma (incorrect, secret is virat-kohli)
    const wrongGuess = await submitGuess(session.gameId, 'priya_7b', 'rohit-sharma');
    assert(wrongGuess.success === true, 'Guess submitted');
    assert(wrongGuess.isCorrect === false, 'Guess accurately evaluated as incorrect');
    assert(wrongGuess.session?.status === 'in_progress', 'Game is NOT ended on wrong guess');
    assert(
      wrongGuess.session?.currentTurn === 'arjun_8a',
      'Turn passed back to Player 1 following incorrect guess'
    );

    // Check Player 1 still has secret protected from Player 2
    const p2AfterWrong = sanitizeGameSession(wrongGuess.session!, 'priya_7b');
    assert(
      p2AfterWrong.player1.selectedCricketerId === null,
      'SECURITY CONFIRMED: Incorrect guess did NOT reveal Player 1 secret'
    );

    // TEST 6: Correct Guess & Victory Handling
    console.log('\n--- Test 6: Correct Deduction & Match Victory ---');
    // Player 1 guesses Jasprit Bumrah (Correct!)
    const winGuess = await submitGuess(session.gameId, 'arjun_8a', 'jasprit-bumrah');
    assert(winGuess.success === true, 'Winning guess evaluated');
    assert(winGuess.isCorrect === true, 'Evaluated as correct');
    assert(winGuess.session?.status === 'completed', 'Match status updated to completed');
    assert(winGuess.session?.winner === 'arjun_8a', 'Player 1 declared the match winner');
    assert(winGuess.session?.winningGuess === 'Jasprit Bumrah', 'Winning cricketer recorded');
    assert((winGuess.session?.player1.score || 0) >= 50, 'Winner awarded 50 points');

    // Grand reveal: Once completed, both secrets are safely revealed
    const completedP1 = sanitizeGameSession(winGuess.session!, 'arjun_8a');
    const completedP2 = sanitizeGameSession(winGuess.session!, 'priya_7b');
    assert(completedP1.revealedPlayer1Cricketer?.name === 'Virat Kohli', 'P1 cricketer revealed on game over');
    assert(completedP1.revealedPlayer2Cricketer?.name === 'Jasprit Bumrah', 'P2 cricketer revealed on game over');
    assert(completedP2.revealedPlayer1Cricketer?.name === 'Virat Kohli', 'Revealed accurately for P2');
    assert(completedP2.revealedPlayer2Cricketer?.name === 'Jasprit Bumrah', 'Revealed accurately for P2');

    // TEST 7: Leaderboard & History Persistence
    console.log('\n--- Test 7: Leaderboard & Match History ---');
    const leaderboard = await getCricketLeaderboard();
    const p1Entry = leaderboard.find((e) => e.username === 'arjun_8a');
    assert(Boolean(p1Entry), 'Winner appears in DPSBuzz leaderboard');
    assert((p1Entry?.wins || 0) >= 1, 'Winner match victory registered in stats');

    const history = await getCricketMatchHistory();
    const lastMatch = history[0];
    assert(Boolean(lastMatch), 'Match history contains recent completed game');
    assert(lastMatch.winnerUsername === 'arjun_8a', 'Match record records correct winner');
    assert(lastMatch.player2Cricketer === 'Jasprit Bumrah', 'Match record stores opponent cricketer');

    // TEST 8: Rematch Feature
    console.log('\n--- Test 8: Rematch Mechanism ---');
    const rematchRes = await requestRematch(session.gameId, 'priya_7b');
    assert(rematchRes.success === true, 'Rematch requested');
    assert(rematchRes.session?.status === 'selecting', 'Game reset to selecting for new match');
    assert(rematchRes.session?.player1.hasSelected === false, 'Player 1 selection reset');
    assert(rematchRes.session?.player2.hasSelected === false, 'Player 2 selection reset');

    console.log(`\n========================================`);
    console.log(`🎉 ALL TESTS COMPLETED: ${passed} passed, ${failed} failed.`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runCricketGameTests();
