const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userdata')
        .setDescription('Displays data about the specified user.')
        .addUserOption(option =>
            option.setName('discord')
                .setDescription('The Discord user to display information about.')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('roblox')
                .setDescription('The Roblox ID or username of the user to display information about.')
                .setRequired(false)
        ),

    async execute(interaction) {
        const discordUser = interaction.options.getUser('discord');
        const robloxInput = interaction.options.getString('roblox');
        const guildId = interaction.guild.id;

        await interaction.deferReply();

        if (!discordUser && !robloxInput) {
            return interaction.editReply('You must provide either a Discord user or a Roblox ID/Username.');
        }

        let userData;

        if (discordUser) {
            try {
                // Fetch Roblox ID using Discord user ID through Bloxlink API
                const discordUserId = discordUser.id;
                const response = await axios.get(`https://api.blox.link/v4/public/guilds/${guildId}/discord-to-roblox/${discordUserId}`, {
                    headers: {
                        'Authorization': process.env.bloxlink_api_key
                    }
                });

                const robloxIdFromBloxlink = response.data.robloxID;
                userData = await fetchRobloxUserData(robloxIdFromBloxlink);
            } catch (error) {
                console.error(error);
                return interaction.editReply('There was an error fetching the Roblox ID from the Discord user.');
            }
        } else if (robloxInput) {
            if (isNaN(robloxInput)) {
                // If robloxInput is not a number, assume it's a username
                try {
                    const response = await axios.post('https://users.roblox.com/v1/usernames/users', {
                        usernames: [robloxInput],
                        excludeBannedUsers: true
                    });

                    if (response.data.data.length === 0) {
                        return interaction.editReply('No Roblox user found with that username.');
                    }

                    const robloxIdFromUsername = response.data.data[0].id;
                    userData = await fetchRobloxUserData(robloxIdFromUsername);
                } catch (error) {
                    console.error(error);
                    return interaction.editReply('There was an error fetching the user data from the Roblox username.');
                }
            } else {
                // If robloxInput is a number, treat it as a Roblox ID
                try {
                    userData = await fetchRobloxUserData(robloxInput);
                } catch (error) {
                    console.error(error);
                    return interaction.editReply('There was an error fetching the user data from the Roblox ID.');
                }
            }
        }

        if (!userData) {
            return interaction.editReply('User data could not be retrieved.');
        }

        const userEmbed = new EmbedBuilder()
            .setTitle(`${userData.displayName} (${userData.name})`)
            .setDescription(userData.description || "No description available.")
            .setColor('#37c6ff')
            .addFields(
                { name: 'User ID', value: userData.id.toString(), inline: true },
                { name: 'Account Created', value: new Date(userData.created).toDateString(), inline: true },
                { name: 'Banned', value: userData.isBanned ? 'Yes' : 'No', inline: true },
                { name: 'Verified Badge', value: userData.hasVerifiedBadge ? 'Yes' : 'No', inline: true },
            )
            .setThumbnail(`https://www.roblox.com/headshot-thumbnail/image?userId=${userData.id}&width=420&height=420&format=png`);

        interaction.editReply({ embeds: [userEmbed] });
    },
};

// Helper function to fetch Roblox user data
async function fetchRobloxUserData(robloxId) {
    try {
        const response = await axios.get(`https://users.roblox.com/v1/users/${robloxId}`);
        const userData = response.data;

        // Add more data fetching if needed, such as game stats
        // For example, fetching game data:
        // const gameDataResponse = await axios.get(`https://some-api-to-fetch-game-data/${robloxId}`);
        // userData.userGameData = gameDataResponse.data;

        return userData;
    } catch (error) {
        console.error('Error fetching Roblox user data:', error);
        throw error;
    }
}