require("dotenv").config();

const fs = require('node:fs');
const path = require('node:path');
const axios = require('axios');
const { Client, Collection, Events, GatewayIntentBits, EmbedBuilder, ActivityType } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessageReactions] });

client.commands = new Collection();
client.cooldowns = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            command.category = folder; // Set the category dynamically
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}
client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	const { cooldowns } = interaction.client;

	if (!cooldowns.has(command.data.name)) {
		cooldowns.set(command.data.name, new Collection());
	}

	const now = Date.now();
	const timestamps = cooldowns.get(command.data.name);
	const defaultCooldownDuration = 3;
	const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1_000;

	if (timestamps.has(interaction.user.id)) {
		const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

		if (now < expirationTime) {
			const expiredTimestamp = Math.round(expirationTime / 1_000);
			return interaction.reply({ content: `Please wait, you are on a cooldown for \`${command.data.name}\`. You can use it again <t:${expiredTimestamp}:R>.`, ephemeral: true });
		}
	}

	timestamps.set(interaction.user.id, now);
	setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);


	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

//client.on("guildMemberUpdate", async (oldMember, newMember) => {
//const guild = newMember.guild;
//const roleId = '1274193376597639279';
//const channelId = '1175954965399867414';

// Check if the old member does not have the role and the new member does
//if (!oldMember.roles.cache.has(roleId) && newMember.roles.cache.has(roleId)) {
//	const embed = new EmbedBuilder()
//		.setTitle('Welcome to Starbase Development!')
//		.setDescription(`Hey there, \`${newMember.user.username}\`! Welcome to the Starbase Development Discord server!`)
//		.setColor('#21ffd8')
//		.setTimestamp();
//
//	const channel = guild.channels.cache.get(channelId);
//	if (channel) {
//		channel.send({ embeds: [embed] });
//	} else {
//		console.error(`Channel with ID ${channelId} not found.`);
//	}
//	}
//});

client.once('ready', async () => {

	const status = client.user.setActivity({
		type: ActivityType.Custom,
		name: "customstatus",
		state: "Having fun with the Starbase Community!",
	});

	console.log(`Ready! Logged in as ${client.user.tag}`);

});

client.login(process.env.token);
