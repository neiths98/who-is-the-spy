require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const { messageOptions } = require('./messageOptions');
const commandStringList = require('./commandStringList').commandStringList;
const Game = require('./classes/game').Game;
const Player = require('./classes/player').Player;

const bot = new Telegraf(process.env.BOT_TOKEN);

var games = [];

// Functions
function findGame(ctx) {
  const chatId = ctx.chat.id;
  const gameIndex = games.findIndex((game) => game.id === chatId);

  if (gameIndex >= 0)
    return games[gameIndex];
  else {
    ctx.reply('Por favor, inicie o bot em:\n /start');
    return false;
  }
}

bot.start((ctx) => {
  const chatId = ctx.update.message.chat.id;
  games.push(new Game(chatId));

  const instructions = `
    Para começar o preparo do jogo utilize o comando /${commandStringList.game_setup}.\nPara o jogo começar é necessário ter de *3-8* jogadores\nQuando estiverem prontos, basta usar o comando /${commandStringList.start_game} para o jogo começar.\nDivirtam-se!`;

  ctx.telegram.sendMessage(chatId, instructions, messageOptions.parseModeOption)
});

bot.command('game_setup', (ctx) => {
  const game = findGame(ctx);

  if (!game)
    return;

  ctx.reply('Olá pessoal! Quem está afim de jogar?', joinGameButtons);
});

bot.command('start_game', (ctx) => {
  const game = findGame(ctx);

  if (!game)
    return;

  game.startGame(ctx);
});

// Buttons
const joinGameButtons = Markup.inlineKeyboard([
  Markup.button.callback('Quero jogar', 'entrar no jogo'),
  Markup.button.callback('To fora', 'sair do jogo'),
], { columns: 1 });

const startBotButton = Markup.inlineKeyboard([
  Markup.button.url('Inicar bot', 'https://telegram.me/QuemEspiaoBot'),
]);

// Button actions
bot.action('entrar no jogo', async (ctx) => {
  const user = ctx.update.callback_query.from;
  const game = findGame(ctx);

  if (!game)
    return

  const player = new Player(user.id, user.first_name, user.username);
  const addedPlayer = await game.addPlayer(ctx, player, startBotButton);
  if (addedPlayer)
    await game.showPlayers(ctx)
});

bot.action('sair do jogo', async (ctx) => {
  const user = ctx.update.callback_query.from;
  const game = findGame(ctx);

  if (!game)
    return

  const removedPlayer = await game.removePlayer(ctx, user.id);
  if (removedPlayer)
    await game.showPlayers(ctx)
});


bot.launch();
