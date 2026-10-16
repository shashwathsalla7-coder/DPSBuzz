import { redirect } from 'next/navigation';

export default function GamesPage() {
  redirect('/chats?view=games');
}
