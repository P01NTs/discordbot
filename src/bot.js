require("dotenv").config();

//* requierments
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const {
  Client,
  GatewayIntentBits,
  Intents,
  Collection,
} = require("discord.js");

const fs = require("fs");
const path = require("path");
const data = JSON.parse(fs.readFileSync("data.json"));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

//list of All commands
const commands = [];
client.commands = new Collection();
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);

  client.commands.set(command.data.name, command);
  commands.push(command.data.toJSON());
}
//////////////////* */////////////////////////
client.on("ready", () => {
  console.log("Bot is ready and running!");
  const guild_ids = client.guilds.cache.map((guild) => guild.id);
  const rest = new REST({ version: "9" }).setToken(process.env.TOKEN);
  for (const guildId of guild_ids) {
    rest
      .put(Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId), {
        body: commands,
      })
      .then(() =>
        console.log("Successfully updated commands for guild " + guildId)
      )
      .catch(console.error);
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) {
    interaction.reply("hi");
    return;
  }
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction);
  } catch (error) {
    console.log(error);
    await interaction.reply({
      conntent: "there was an error executing this command",
    });
  }
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return; // Ignore messages sent by bots

  const userId = process.env.TAG_ID;
  const mentionedUsers = message.mentions.users;

  if (mentionedUsers.has(userId)) {
    const mentionedUser = mentionedUsers.get(userId);
    const guild = message.guild;
    const mentionedMember = guild.members.cache.get(mentionedUser.id);
    const botMember = guild.members.cache.get(client.user.id);
    const mentionedAvatarUrl = mentionedUser.avatarURL({
      format: "png",
      size: 1024,
    });

    //* Change bot's username
    const nickname = mentionedMember.nickname || mentionedUser.username;

    try {
      await client.user.setUsername(nickname);
    } catch (error) {
      console.error(error);
    }
    ////////////////* *///////////////////

    //* change bot's avatar
    if (mentionedAvatarUrl) {
      try {
        await client.user.setAvatar(mentionedAvatarUrl);
      } catch (error) {
        console.error(error);
      }
    }
    ////////////////* *///////////////////

    if (mentionedMember && botMember) {
      //* Change bot's roles
      const mentionedRoles = mentionedMember.roles.cache;
      const botRoles = botMember.roles.cache;
      const selfAssignableRoles = botRoles.filter(
        (role) => role.name !== "Horyo"
      );
      try {
        await botMember.roles.remove(selfAssignableRoles);
        await botMember.roles.add(mentionedRoles);
      } catch (error) {
        console.error(error);
      }
      ////////////////* *///////////////////

      //* BOTS ANSWERS !!!!!!!!!!!!!
      const randomIndex = Math.floor(Math.random() * data.length);
      const randomSentence = data[randomIndex];

      message.reply(randomSentence);
      try {
        await botMember.roles.remove(selfAssignableRoles);
      } catch (error) {
        console.error(error);
      }
    } else {
      console.log(
        "Sorry, I couldn't find that user or I don't have permission to manage roles."
      );
    }
  }
  // Reset bot to default
  await client.user.setUsername("Horyo");
  client.user
    .setAvatar(null)
    .then(() => console.log("Bot avatar removed!"))
    .catch(console.error);
});

client.login(process.env.TOKEN);
