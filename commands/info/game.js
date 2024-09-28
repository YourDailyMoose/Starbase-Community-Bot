const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('game')
        .setDescription('Displays information about the game.'),
    async execute(interaction) {
        await interaction.deferReply();

        try {
            const gameResponse = await axios.get('https://games.roblox.com/v1/games', {
                params: {
                    universeIds: process.env.STARBASE_UNIVERSE_ID,
                }
            });

            // Ensure the response data structure is as expected
            if (gameResponse.data && gameResponse.data.data && gameResponse.data.data.length > 0) {
                const gameData = gameResponse.data.data[0];

                // Fetch game media
                const mediaResponse = await axios.get(`https://thumbnails.roblox.com/v1/places/gameicons?placeIds=${gameData.rootPlaceId}&returnPolicy=PlaceHolder&size=512x512&format=Png&isCircular=false`);

                let imageUrl = '';
                if (mediaResponse.data && mediaResponse.data.data && mediaResponse.data.data.length > 0) {
                    imageUrl = mediaResponse.data.data[0].imageUrl;
                }

                const embed = new EmbedBuilder()
                    .setTitle(gameData.name + 'cheese')
                    .setColor('#21ffd8')
                    .setDescription(gameData.description)
                    .addFields(
                        { name: 'Player Count', value: `${gameData.playing}`, inline: true },
                        { name: 'Visits', value: `${gameData.visits}`, inline: true },
                        { name: 'Max Players', value: `${gameData.maxPlayers}`, inline: true },
                        { name: 'Created', value: new Date(gameData.created).toLocaleDateString(), inline: true },
                        { name: 'Updated', value: new Date(gameData.updated).toLocaleDateString(), inline: true },
                        { name: 'Genre', value: gameData.genre, inline: true },
                        { name: 'Favorited Count', value: `${gameData.favoritedCount}`, inline: true }
                    )
                    .setTimestamp();

                if (imageUrl) {
                    embed.setThumbnail(imageUrl);
                }

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setLabel('View on Roblox')
                            .setStyle(ButtonStyle.Link)
                            .setURL(`https://www.roblox.com/games/${gameData.rootPlaceId}`)
                    );

                await interaction.editReply({ embeds: [embed], components: [row] });
            } else {
                console.log('No data found');
                await interaction.editReply({ content: 'No game data found.', ephemeral: true });
            }
        } catch (error) {
            console.error('API Request Error:', error);
            await interaction.editReply({ content: 'There was an error while fetching the game information.', ephemeral: true });
        }
    }
};