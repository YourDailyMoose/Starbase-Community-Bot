const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('liveplayers')
        .setDescription('Displays the current number of players in the game.'),
    async execute(interaction) {
        await interaction.deferReply();

        try {
            const response = await axios.get('https://games.roblox.com/v1/games', {
                params: {
                    universeIds: process.env.STARBASE_UNIVERSE_ID,
                }
            });

            let playerCount = 0; // Define playerCount in the outer scope

            // Ensure the response data structure is as expected
            if (response.data && response.data.data && response.data.data.length > 0) {
                playerCount = response.data.data[0].playing;
            } else {
                console.log('No data found');
            }

            const embed = new EmbedBuilder()
                .setTitle('Starbase Player Count')
                .setColor('#21ffd8')
                .setDescription(`There are currently **${playerCount}** players in the game.`)
                .setTimestamp();    

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('API Request Error:', error);
            await interaction.editReply({ content: 'There was an error while fetching the player count.', ephemeral: true });
        }
    }
};