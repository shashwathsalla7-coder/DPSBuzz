import { redirect } from 'next/navigation';

export default function GamePage() {
  redirect('/chats?view=games');
}
