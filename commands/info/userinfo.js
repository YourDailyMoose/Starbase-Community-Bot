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

        if (discordUser && robloxInput) {
            return interaction.editReply('You cannot provide both a Discord user and a Roblox ID/Username.');
        }

        try {
            let userData = await fetchUserData(discordUser, robloxInput, guildId);
            if (!userData) {
                return interaction.editReply('User data could not be retrieved.');
            }

            const [groupRankData, earnedGameBadges, userPresence, avatarHeadshotUrl] = await Promise.all([
                fetchGroupRank(userData.id),
                fetchEarnedGameBadges(userData.id),
                fetchUserPresence(userData.id),
                fetchAvatarHeadshot(userData.id)
            ]);

            const userEmbed = buildUserEmbed(userData, groupRankData, earnedGameBadges, userPresence, avatarHeadshotUrl);

            return interaction.editReply({ embeds: [userEmbed] });
        } catch (error) {
            console.error('Error executing command:', error);
            return interaction.editReply('An error occurred while processing the request.');
        }
    }
};

async function fetchUserData(discordUser, robloxInput, guildId) {
    try {
        if (discordUser) {
            const robloxId = await fetchRobloxIdFromDiscord(discordUser.id, guildId);
            return await fetchRobloxUserData(robloxId);
        } else if (robloxInput) {
            return isNaN(robloxInput) 
                ? await fetchRobloxUserDataFromUsername(robloxInput)
                : await fetchRobloxUserData(robloxInput);
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
        throw error;
    }
}

async function fetchRobloxIdFromDiscord(discordUserId, guildId) {
    const response = await axios.get(`https://api.blox.link/v4/public/guilds/${guildId}/discord-to-roblox/${discordUserId}`, {
        headers: { 'Authorization': process.env.bloxlink_api_key }
    });
    return response.data.robloxID;
}

async function fetchRobloxUserDataFromUsername(username) {
    const response = await axios.post('https://users.roblox.com/v1/usernames/users', {
        usernames: [username],
        excludeBannedUsers: true
    });
    const user = response.data.data[0];
    if (!user) throw new Error('No Roblox user found with that username.');
    return fetchRobloxUserData(user.id);
}

async function fetchRobloxUserData(robloxId) {
    const response = await axios.get(`https://users.roblox.com/v1/users/${robloxId}`);
    return response.data;
}

async function fetchGroupRank(robloxId) {
    const groupResponse = await axios.get(`https://groups.roblox.com/v1/users/${robloxId}/groups/roles`);
    const group = groupResponse.data.data.find(g => g.group.id === 7888688);
    return group ? group.role.rank : null;
}

async function fetchEarnedGameBadges(robloxId) {
    const playerBadges = await fetchAllBadges(`https://badges.roblox.com/v1/users/${robloxId}/badges`);
    const gameBadges = await fetchAllBadges(`https://badges.roblox.com/v1/universes/${process.env.STARBASE_UNIVERSE_ID}/badges`);
    return playerBadges.filter(playerBadge => gameBadges.some(gameBadge => gameBadge.id === playerBadge.id));
}

async function fetchAllBadges(url) {
    let allBadges = [], cursor = null;
    do {
        const response = await axios.get(url, { params: { limit: 100, cursor, sortOrder: 'Asc' } });
        allBadges = allBadges.concat(response.data.data);
        cursor = response.data.nextPageCursor;
    } while (cursor);
    return allBadges;
}

async function fetchUserPresence(robloxId) {
    const response = await axios.post('https://presence.roblox.com/v1/presence/users', { userIds: [robloxId] });
    return response.data.userPresences[0];
}

async function fetchAvatarHeadshot(robloxId) {
    const response = await axios.get('https://thumbnails.roblox.com/v1/users/avatar-headshot', {
        params: { userIds: robloxId, size: '720x720', format: 'Png', isCircular: false }
    });
    return response.data.data[0].imageUrl;
}

function buildUserEmbed(userData, groupRank, earnedGameBadges, userPresence, avatarHeadshotUrl) {
    const groupColor = getGroupColor(groupRank);
    const presenceTypes = { 0: 'Offline', 1: 'Online', 2: 'InGame', 3: 'InStudio', 4: 'Invisible' };
    const userPresenceString = presenceTypes[userPresence.userPresenceType] || 'Unknown';

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

    if (userPresence) {
        userEmbed.addFields(
            { name: 'Presence', value: userPresenceString, inline: true },
            { name: 'Last Location', value: userPresence.lastLocation || 'N/A', inline: true },
            { name: 'Last Online', value: new Date(userPresence.lastOnline).toLocaleString(), inline: true }
        );
    }

    return userEmbed;
}

function getGroupColor(rank) {
    const rankColors = {
        254: '#3498db', 255: '#3498db', // Developer & Holder
        252: '#029699', // Head of Moderation
        250: '#e74c3c', // Senior Moderator
        201: '#e48b20', // Moderator
        253: '#00e9ff', 8: '#00e9ff', // Active Contributor
        251: '#ba65d6', // Liz
        202: '#9b59b6', 203: '#9b59b6', // No Vibrations
        7: '#d10eab' // Cool People
    };
    return rankColors[rank] || '#37c6ff'; // Default color
}
