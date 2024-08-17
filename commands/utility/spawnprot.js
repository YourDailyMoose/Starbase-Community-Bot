const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spawnprot')
        .setDescription('Posts the spawn protection essay'),

    async execute(interaction) {
        const spawnProtEmbed = new EmbedBuilder()
            .setTitle('Spawn Protection')
            .setDescription('In order to keep spawn killing a purely unviable tactic there needs to be some sort of asymmetry with combat advantages near starbase (with advantages wearing off once combat is initiated it makes it possible to dwell near spawn to kill, which we want to make entirely impossible) currently asymmetry is skewed towards those spawning in which leads to situations described, we think those are reasonable concessions to achieving this goal. \n\nCommon counterpoints are (1) that long range weapons can still be fired within starbase spawn protection and (2) that one might want to kill an auto ship that has come near the starbase but is being attacked by a player with protection. \n\nFor point 1 extreme range weapons like the cruise missiles are not effective to the point where an effective engagement could occur entirely within the confines of the spawn with protection. For point 2 we can consider it as another case of spawning player vs. existing player pvp, even though it is initiated as an engagement against an auto ship (which does not attack within spawn confines) it is still considered a spawn-protected engagement because of a newly spawning player with protection, there is no way to solve such a problem for only such cases that can maintain attacking spawn disadvantage while also allowing the auto ship to be attacked while in spawn confines.')
            .setColor('#21ffd8')

        interaction.reply({ embeds: [spawnProtEmbed] });

    }
}
        

        