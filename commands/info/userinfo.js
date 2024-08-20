const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userdata')
        .setDescription('Displays data about the specified user.')
        .addUserOption(option =>
            option.setName('discord_user')
                .setDescription('The Discord user to display information about.')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('roblox_id')
                .setDescription('The Roblox ID of the user to display information about.')
                .setRequired(false)
        ),

    async execute(interaction) {
        const discordUser = interaction.options.getUser('discord_user');
        const robloxId = interaction.options.getString('roblox_id');

        const guildId = interaction.guild.id;
        const discordUserId = discordUser.id;

        await interaction.deferReply();

        if (!discordUser && !robloxId) {
            return interaction.editReply('You must provide either a Discord user or a Roblox ID.');
        }

        let userData;
        if (discordUser) {
            // Fetch Roblox ID using Discord user ID
            const discordUserId = discordUser.id;
            const response = await axios.get(`https://api.blox.link/v4/public/guilds/${guildId}/discord-to-roblox/${discordUserId}`, {
                headers: {
                    'Authorization': process.env.bloxlink_api_key
                }
            });
            userData = response.data;
            console.log(userData);
        } else if (robloxId) {
            // Fetch user data using Roblox ID
            const response = await axios.get(`https://api.roblox.com/users/${robloxId}`);
            userData = response.data;
            console.log(userData);
        }

        const userEmbed = new EmbedBuilder()
            .setTitle(userData.username)
            .setDescription(`User ID: ${userData.userId}\nJoin Date: ${userData.joinDate}\nLast Online: ${userData.lastOnline}`)
            .setColor('#37c6ff')
            .addFields(
                { name: 'Game Data', value: `Level: ${userData.userGameData.level}\nTotal XP: ${userData.userGameData.totalXp}\nResearch: ${userData.userGameData.research}\nCargo Reputation: ${userData.userGameData.cargoReputation}\nDaily Quest Credits: ${userData.userGameData.dailyQuestCredits}\nProgress to Next Level: ${userData.userGameData.progressToNextLevel}%\nXP Needed for Next Level: ${userData.userGameData.xpNeededForNextLevel}` },
                { name: 'Owned Ships', value: userData.userGameData.ownedShips.join(', ') } // Convert array to string
            )
            .setThumbnail('https://tr.rbxcdn.com/30DAY-AvatarHeadshot-0766C0E6F9DF0AD50E46FB39267CAE3A-Png/150/150/AvatarHeadshot/Webp/noFilter');

        interaction.editReply({ embeds: [userEmbed] });
    },
};