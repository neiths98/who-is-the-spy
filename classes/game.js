const commandStringList = require('../commandStringList').commandStringList;
const messageOptions = require('../messageOptions').messageOptions;
const originalCards = require('../cards').cards;

class Game {

  players = [];
  gameCards;
  spyPlayer;
  gameLocation;

  constructor(id) {
    this.id = id
    this.gameCards = new Array(...originalCards);
  }

  #setSpy() {
    const spyIndex = Math.floor(Math.random() * this.players.length);
    this.spyPlayer = this.players[spyIndex];
  }

  #setGameLocation() {
    const cardIndex = Math.floor(Math.random() * this.gameCards.length);
    this.gameLocation = this.gameCards[cardIndex];
    this.gameCards.splice(cardIndex, 1);
  }

  async #setRoles(ctx) {
    let locationRoles = this.gameLocation.roles;

    this.players.forEach(async (player) => {
      await ctx.telegram.sendMessage(player.id, '_-------- Novo jogo --------_', messageOptions.parseModeOption);

      if (player.id === this.spyPlayer.id) {
        await ctx.telegram.sendMessage(player.id, 'Você é o espião!')
      } else {
        const roleIndex = Math.floor(Math.random() * locationRoles.length);
        const role = locationRoles[roleIndex];
        await ctx.telegram.sendMessage(player.id, `Vocês estão no *${this.gameLocation.location}* e você é *${role}*`, messageOptions.parseModeOption);
        locationRoles.splice(roleIndex, 1);
      }
    })
  }

  startGame(ctx) {
    if (this.players.length < 3) {
      ctx.reply(
        `É necessário ter *pelo menos 3* jogadores para começar o jogo. Adicione mais jogadores:\n/${commandStringList.game_setup}`,
        messageOptions.parseModeOption
      );
      return;
    }

    this.#setSpy();
    this.#setGameLocation();
    this.#setRoles(ctx);
  }

  async addPlayer(ctx, newPlayer, startBotButton) {
    const chat = ctx.update.callback_query.message.chat;

    if (this.players.length >= 8) {
      await ctx.reply('Não é possível adicionar mais jogadores. O jogo foi feito para 3-8 jogadores');
      return false;
    }

    if (this.players.some((player) => player.id === newPlayer.id))
      return false;

    try {
      await ctx.telegram.sendMessage(newPlayer.id, `Você entrou no jogo do grupo *${chat.title}*!`, messageOptions.parseModeOption);
    } catch (error) {
      await ctx.reply(`@${newPlayer.username}, para entrar no jogo é necessário iniciar o bot`, startBotButton);
      return false;
    }

    this.players.push(newPlayer);
    await ctx.reply(`${newPlayer.name} entrou no jogo!`);

    return true;
  }

  async removePlayer(ctx, playerId) {
    if (!this.players.length)
      return false;

    const playerIndex = this.players.findIndex((player) => player.id === playerId);
    if (playerIndex < 0)
      return false;
    
    const player = this.players[playerIndex];
    this.players.splice(playerIndex, 1);
    await ctx.reply(`${player.name} saiu do jogo!`);

    return true;
  }

  async showPlayers(ctx) {
    let message = '*Jogadores:*\n';

    if (!this.players.length) {
      message += '_(Lista vazia)_'
      await ctx.reply(message, messageOptions.parseModeOption);
      return;
    }
  
    this.players.forEach((player) => message += `- ${player.name}\n`);

    if (this.players.length < 8)
      message += `\nPara entrar ou sair do jogo, clique aqui:\n/${commandStringList.game_setup}\n`;
  
    if (this.players.length >= 3)
      message += `\n*O jogo já pode ser iniciado!*\nClique aqui para começar:\n/${commandStringList.start_game}`;
  
    await ctx.reply(message, messageOptions.parseModeOption);
  }

}

module.exports.Game = Game;