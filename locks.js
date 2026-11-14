// A different lock screen for every day (style + words). Styles live in app.css as  body.lk-<style>
const LOCKS = {
  default:      { style: "heart",    icon: "",   title: "Hey Khuchu Puchu 💌", sub: "Enter the secret password to open my heart", btn: "Unlock 💖", ph: "Secret password…" },
  "2026-11-16": { style: "notebook", icon: "📒", title: "Exam Hall: Love Maths", sub: "Write the secret answer to start your paper, Sir", btn: "Start the exam ✏️", ph: "Write your answer here…" },
  "2026-11-17": { style: "news",     icon: "📰", title: "The Daily Hamad", sub: "Today's paper is only for subscribers. Enter your code", btn: "Read today's paper", ph: "Subscriber code…" },
  "2026-11-18": { style: "phone",    icon: "📱", title: "1 new message from Chircot 🐦", sub: "Unlock your phone to read it", btn: "Unlock", ph: "Passcode" },
  "2026-11-19": { style: "glass",    icon: "🌸", title: "The Secret Garden", sub: "Only one person has the key to this garden", btn: "Open the gate 🌷", ph: "Garden key…" },
  "2026-11-20": { style: "brutal",   icon: "🎟️", title: "YOU HAVE A WINNING TICKET!", sub: "Type the code to claim your prize", btn: "CLAIM MY PRIZE →", ph: "PRIZE CODE" },
  "2026-11-21": { style: "receipt",  icon: "🧾", title: "AMINA'S LOVE STORE", sub: "Member login. Enter your card number", btn: "[ PRINT MY RECEIPT ]", ph: "card no." },
  "2026-11-22": { style: "neu",      icon: "✈️", title: "Love Airlines Check-in", sub: "Passenger: Hamad Moiz Chaudhary. Enter your booking code", btn: "Check in", ph: "Booking code" },
  "2026-11-23": { style: "cinema",   icon: "🎬", title: "TONIGHT'S PREMIERE", sub: "Show your ticket code at the door", btn: "ENTER THE CINEMA", ph: "TICKET CODE" },
  "2026-11-24": { style: "stars",    icon: "⭐", title: "Make a wish on a star", sub: "Whisper the magic words to light up the sky", btn: "Light up the sky ✨", ph: "Magic words…" },
  "2026-11-25": { style: "polaroid", icon: "📷", title: "Our little scrapbook", sub: "Shh, it's private. Password please!", btn: "Open the scrapbook", ph: "password…" },
  "2026-11-26": { style: "chalk",    icon: "☕", title: "Café Chircot", sub: "Members only. Say the secret word to get a table", btn: "Get my table", ph: "Secret word" },
  "2026-11-27": { style: "pixel",    icon: "👾", title: "INSERT PASSWORD", sub: "PLAYER 1: HAMAD", btn: "PRESS START", ph: "PASSWORD" },
  "2026-11-28": { style: "clay",     icon: "🎈", title: "You're invited!", sub: "A party for one very special guest. Enter your invite code", btn: "Join the party 🎉", ph: "Invite code…" },
  "2026-11-29": { style: "luxe",     icon: "🏆", title: "The Golden Heart Awards", sub: "Black tie only. Enter your invitation code", btn: "Walk the red carpet", ph: "Invitation code" },
  "2026-11-30": { style: "story",    icon: "👑", title: "Once upon a time…", sub: "This storybook opens with a secret word", btn: "Open the book 📖", ph: "Secret word…" },
  "2026-12-01": { style: "party",    icon: "🎂", title: "It's your birthday! 🎂", sub: "Unlock your biggest surprise", btn: "Open my birthday 🎁", ph: "Birthday password…" }
};
