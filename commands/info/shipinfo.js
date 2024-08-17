const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shipinfo')
        .setDescription('Displays informtion about the specified ship.')
        .addStringOption(option =>
            option.setName('ship')
                .setDescription('The name of the ship to display information about.')
                .setRequired(true)
                .addChoices(
                    { name: 'Luxury Cruiser', value: 'luxury-cruiser' },
                )
        ),

    async execute(interaction) {
        const ship = interaction.options.getString('ship');
        await interaction.deferReply();

        // Fetch ship information from database
        // const shipInfo = fetchShipInfo(ship);

        const shipEmbed = new EmbedBuilder()
            .setTitle(shipInfo.name)
            .setDescription(shipInfo.overview)
            .setColor('#37c6ff')
            .addFields(
                { name: 'Performance', value: `Shield Strength: ${shipInfo.performance.shieldStrength}\nMax Speed: ${shipInfo.performance.maxSpeed}\nBoost Duration: ${shipInfo.performance.boostDuration}\nCloaking: ${shipInfo.performance.cloaking ? '✅' : '❌'}\nRecommended Crew: ${shipInfo.performance.recommendedCrew}` },
                { name: 'Weaponry', value: shipInfo.weaponry },
                { name: 'Usage', value: shipInfo.usage }
            )
            .setThumbnail('https://static.wikia.nocookie.net/starbase-roblox/images/7/7b/Luxury_Cruiser.png/revision/latest/scale-to-width-down/1000?cb=20220727111016')
            .setFooter({ text: "Ship information provided by the Starbase Wiki!" });


        const wikiButton = new ButtonBuilder()
            .setLabel('Starbase Wiki Page')
            .setStyle(ButtonStyle.Link)
            .setURL('https://starbase-roblox.fandom.com/wiki/Luxury_Cruiser');


            const actionRow = new ActionRowBuilder()
            .addComponents(wikiButton);


        interaction.editReply({ embeds: [shipEmbed], components: [actionRow] });

    },
};