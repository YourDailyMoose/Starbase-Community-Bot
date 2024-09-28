const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder } = require('discord.js');
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

        if (discordUser && robloxInput) {
            return interaction.editReply('You cannot provide both a Discord user and a Roblox ID/Username.');
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
                if (error.response) {
                    console.error(error);

                    if (error.response && error.response.status === 404) {
                        return interaction.editReply('The user is not linked to Bloxlink in this server.');
                    }

                    return interaction.editReply('There was an error fetching the Roblox ID from the Discord user.');
                }
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

        // Fetch group information
        let groupRank = null;
        let groupColor = '#37c6ff'; // Default color

        try {
            const groupResponse = await axios.get(`https://groups.roblox.com/v1/users/${userData.id}/groups/roles`);
            const groups = groupResponse.data.data;

            // Find the specific group with ID 7888688
            const group = groups.find(g => g.group.id === 7888688);

            if (group) {
                groupRank = group.role.rank;

                // Set color based on rank
                if (groupRank == 254 || groupRank == 255) {
                    groupColor = '#3498db'; // Developer & Holder
                } else if (groupRank == 252) {
                    groupColor = '#029699'; // Head of Moderation
                } else if (groupRank == 250) {
                    groupColor = '#e74c3c'; // Senior Moderator
                } else if (groupRank == 201) {
                    groupColor = '#e48b20'; // Moderator
                } else if (groupRank == 8 || groupRank == 253) {
                    groupColor = '#00e9ff'; // Active Contributor
                } else if (groupRank == 251) {
                    groupColor = '#ba65d6'; // Liz
                } else if (groupRank == 202 || groupRank == 203) {
                    groupColor = '#9b59b6'; // No Vibrations
                } else if (groupRank == 7) {
                    groupColor = '#d10eab'; // Cool People
                }
            } 
        } catch (error) {
            console.error('Error fetching group information:', error);
        }

        // Fetch player badges
        let playerBadges = [];
        try {
            const badgesResponse = await axios.get(`https://badges.roblox.com/v1/users/${userData.id}/badges`);
            playerBadges = badgesResponse.data.data;
        } catch (error) {
            console.error('Error fetching player badges:', error);
        }

        // Fetch game badges
        let gameBadges = [];
        try {
            const gameBadgesResponse = await axios.get(`https://badges.roblox.com/v1/universes/${process.env.STARBASE_UNIVERSE_ID}/badges`);
            gameBadges = gameBadgesResponse.data.data;
        } catch (error) {
            console.error('Error fetching game badges:', error);
        }

        // Cross-reference player badges with game badges
        const earnedGameBadges = playerBadges.filter(playerBadge => 
            gameBadges.some(gameBadge => gameBadge.id === playerBadge.id)
        );

        // Fetch user presence
        let userPresence = null;
        try {
            const presenceResponse = await axios.post('https://presence.roblox.com/v1/presence/users', {
                userIds: [userData.id]
            });
            userPresence = presenceResponse.data.userPresences[0];
        } catch (error) {
            console.error('Error fetching user presence:', error);
        }

        // Fetch avatar headshot
        let avatarHeadshotUrl = '';
        try {
            const headshotResponse = await axios.get('https://thumbnails.roblox.com/v1/users/avatar-headshot', {
                params: {
                    userIds: userData.id,
                    size: '720x720',
                    format: 'Png',
                    isCircular: false
                }
            });
            avatarHeadshotUrl = headshotResponse.data.data[0].imageUrl;
        } catch (error) {
            console.error('Error fetching avatar headshot:', error);
        }

        const userEmbed = new EmbedBuilder()
            .setTitle(`${userData.displayName} (${userData.name})`)
            .setDescription(userData.description || "No description available.")
            .setColor(groupColor)
            .addFields(
                { name: 'User ID', value: userData.id.toString(), inline: true },
                { name: 'Account Created', value: new Date(userData.created).toDateString(), inline: true },
                { name: 'Banned', value: userData.isBanned ? 'Yes' : 'No', inline: true },
                { name: 'Verified Badge', value: userData.hasVerifiedBadge ? 'Yes' : 'No', inline: true },
            )
            .setThumbnail(avatarHeadshotUrl);

        if (groupRank !== null) {
            userEmbed.addFields({ name: 'Group Rank', value: groupRank.toString(), inline: true });
        }

        if (earnedGameBadges.length > 0) {
            const badgeNames = earnedGameBadges.map(badge => badge.name).join(', ');
            userEmbed.addFields({ name: 'Earned Game Badges', value: badgeNames, inline: true });
        }

        const presenceTypes = {
            0: 'Offline',
            1: 'Online',
            2: 'In-Game',
            3: 'Roblox Studio',
            4: 'Invisible'
        };
        
        const userPresenceString = presenceTypes[userPresence.userPresenceType] || 'Unknown';

        if (userPresence) {
            userEmbed.addFields(
                { name: 'Presence', value: userPresenceString, inline: true },
                { name: 'Last Location', value: userPresence.lastLocation || 'N/A', inline: true },
                { name: 'Last Online', value: new Date(userPresence.lastOnline).toLocaleString(), inline: true }
            );
        }

        const { ButtonBuilder, ButtonStyle } = require('discord.js');

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('View Profile')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`https://www.roblox.com/users/${userData.id}/profile`)
            );

        await interaction.editReply({ embeds: [userEmbed], components: [actionRow] });
    },
};

// Helper function to fetch Roblox user data
async function fetchRobloxUserData(robloxId) {
    try {
        const response = await axios.get(`https://users.roblox.com/v1/users/${robloxId}`);
        const userData = response.data;

        return userData;
    } catch (error) {
        console.error('Error fetching Roblox user data:', error);
        throw error;
    }
}