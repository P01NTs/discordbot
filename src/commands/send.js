const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("send")
    .setDescription("respond with send nudes!"),
  async execute(interaction) {
    await interaction.reply("send nudes!");
  }
};