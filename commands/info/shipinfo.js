const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Function to read ship data from JSON files
const getShipData = () => {
    const shipsDir = path.join(__dirname, '../../data/ships');
    const shipFolders = fs.readdirSync(shipsDir).filter(file => fs.statSync(path.join(shipsDir, file)).isDirectory());
    const ships = shipFolders.map(folder => {
        const shipData = require(path.join(shipsDir, folder, 'details.json'));
        return { name: shipData.name, value: folder, data: shipData };
    });
    return ships;
};

// Get ship data
const ships = getShipData();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shipinfo')
        .setDescription('Displays information about the specified ship.')
        .addStringOption(option => {
            option.setName('ship')
                .setDescription('The name of the ship to display information about.')
                .setRequired(true);
            ships.forEach(ship => option.addChoices({ name: ship.name, value: ship.value }));
            return option;
        }),

    async execute(interaction) {
        const shipValue = interaction.options.getString('ship');

        await interaction.deferReply();

        try {
            // Find the selected ship data
            const shipInfo = ships.find(ship => ship.value === shipValue).data;


            const roleNames = {
                lightBombers: "Light Bombers",
                fighters: "Fighters",
                freighters: "Freighters",
                escorts: "Escorts",
                transports: "Transports",
                heavyBombers: "Heavy Bombers",
                warships: "Warships",
                carriers: "Carriers",
                invasionMotherShips: "Invasion Mother Ships",
                hoverVehicles: "Hover Vehicles",
                questChainRewards: "Quest Chain Rewards",
                dailyQuestShips: "Daily Quest Ships",
                communityShips: "Community Ships",
                eliteUnits: "Elite Units",
                experimentalWeaponsSystems: "Experimental Weapons Systems",
                experimentalGroundUnits: "Experimental Ground Units",
                prototypes: "Prototypes",
                modernShipsPack: "Modern Ships Pack",
                retroShipPack: "Retro Ship Pack",
                retroShipPack2: "Retro Ship Pack 2",
                modernJetsPack: "Modern Jets Pack",
                modernJetsPack2: "Modern Jets II",
                stellarWarsShipPack: "Stellar Wars Ship Pack",
                starBlazingLegendsShipPack: "Star Blazing Legends Ship Pack",
                ringWarsUmscShipPack: "Ring Wars UMSC Ship Pack",
                concordatRingWarsShipPack: "Concordat Ring Wars Ship Pack",
                starportalShipPack: "Starportal Ship Pack",
                mechrossShipPack: "Mechross Ship Pack",
                spookyShipPack2022: "Spooky Ship Pack",
                ghastlyShipPack2023: "Ghastly Ship Pack",
                festiveShipPack2022: "Festive Ship Pack",
                holidayShipPack2023: "Holiday Ship Pack",
                stellarTrekWarriorsShipPack: "Stellar Trek Warriors Ship Pack"
            };

            const capitalizedRole = roleNames[shipInfo.role] || shipInfo.role;

            // Construct the weapons field value dynamically
                        const weaponsFieldValue = Object.entries(shipInfo.weapons).map(([key, weapon]) => {
                let weaponDetails = `**${weapon.name} (x${weapon.quantity}):**\nReload Time: ${weapon.reloadTime} s\n`;
                
                if (weapon.turretRotation !== null) {
                    weaponDetails += `Turret Rotation: ${weapon.turretRotation}\n`;
                }
                
                if (weapon.shells) {
                    weaponDetails += 'Shells:\n';
                    weaponDetails += Object.entries(weapon.shells).map(([shellKey, shell]) => {
                        let shellDetails = `  - **${shell.name}**:\n`;
                        
                        if (shell.damagesShield.dealsDamage) {
                            shellDetails += `    - Damages Shield: Yes, Value: ${shell.damagesShield.value}\n`;
                        } else {
                            shellDetails += `    - Damages Shield: No\n`;
                        }
                        
                        if (shell.damagesHull.dealsDamage) {
                            shellDetails += `    - Damages Hull: Yes, Value: ${shell.damagesHull.value}\n`;
                        } else {
                            shellDetails += `    - Damages Hull: No\n`;
                        }
                        
                        if (shell.effectedByGravity !== null) {
                            shellDetails += `    - Affected by Gravity: ${shell.effectedByGravity ? 'Yes' : 'No'}\n`;
                        }
                        
                        if (shell.startsFires !== null) {
                            shellDetails += `    - Starts Fires: ${shell.startsFires ? 'Yes' : 'No'}\n`;
                        }
                        
                        return shellDetails.trim();
                    }).join('\n');
                }
                
                return weaponDetails.trim();
            }).join('\n\n');

            const shipEmbed = new EmbedBuilder()
                .setTitle(shipInfo.name)
                .setDescription(shipInfo.shipDescription || 'No description available.')
                .setColor('#37c6ff')
                .addFields(
                    { name: 'Role', value: capitalizedRole, inline: true },
                    { name: 'Cost', value: `${shipInfo.cost} exp`, inline: true },
                    { name: 'Performance', value: `Shield Strength: ${shipInfo.performance.shieldStrength}\nMax Speed: ${shipInfo.performance.maxSpeed}\nBoost Duration: ${shipInfo.performance.boostDuration}\nCloaking: ${shipInfo.performance.cloaking ? '✅' : '❌'}\nMinimum Efficient Crew: ${shipInfo.performance.minimumEfficientCrew}` },
                    { name: 'Weapons', value: weaponsFieldValue, inline: false }
                )
                .setFooter({ text: "Information sourced from in-game." });

            const wikiButton = new ButtonBuilder()
                .setLabel('Wiki Page')
                .setStyle(ButtonStyle.Link)
                .setURL(shipInfo.url);

            const actionRow = new ActionRowBuilder()
                .addComponents(wikiButton);

            await interaction.editReply({ embeds: [shipEmbed], components: [actionRow] });
        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: 'There was an error while executing this command!' });
        }
    },
};