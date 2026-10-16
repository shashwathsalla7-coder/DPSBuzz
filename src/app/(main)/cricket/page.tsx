import { redirect } from 'next/navigation';

export default function CricketPage() {
  redirect('/chats?view=games');
}
