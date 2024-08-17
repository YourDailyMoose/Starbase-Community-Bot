const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('about')
        .setDescription('Displays information about the bot.'),
    async execute(interaction) {

        const commandCount = interaction.client.commands.size;

        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        const uptimeString = hours > 0 
            ? `${hours} hours, ${minutes} minutes` 
            : `${minutes} minutes, ${seconds} seconds`;

        const embed = new EmbedBuilder()
            .setTitle("Hey! I'm John Starbase!")
            .setDescription("I am here to provide a fun twist to the server. My main function is to serve as a discord wiki bot, providing information about various topics. I can also provide some fun commands to keep you entertained!\n\nI am still in development, so please be patient with me. If you have any suggestions or feedback, please let me know!\n\nI hope you enjoy your time with me!")
            .addFields(
                { name: "Commands", value: `${commandCount || "Unable to Fetch"}`, inline: true },
                { name: "Uptime", value: `${uptimeString}`, inline: true },
            )
            .setColor("#21ffd8")
            .setFooter({ text: "Created by YourDailyMoose - Senior Moderator" });

        const button = new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setLabel("Github Repository")
            .setURL("https://github.com/YourDailyMoose/Starbase-Community-Bot");

        const inviteButton = new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setLabel("Add me to your server!")
            .setURL("https://discord.com/oauth2/authorize?client_id=1272212206439890965");

        const actionRow = new ActionRowBuilder().addComponents(button, inviteButton);

        await interaction.reply({ embeds: [embed], components: [actionRow], ephermal: true });
    }
};