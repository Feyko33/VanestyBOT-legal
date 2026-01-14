const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Configuration des IDs depuis les variables d'environnement
const CONFIG = {
    WELCOME_CHANNEL: process.env.WELCOME_CHANNEL || '1460390582131228825',
    ANNOUNCE_CHANNEL: process.env.ANNOUNCE_CHANNEL || '1460393157450793001',
    TICKET_CHANNEL: process.env.TICKET_CHANNEL || '1460737927159091264',
    TICKET_CATEGORY: process.env.TICKET_CATEGORY || '1460737483628220642',
    RULES_CHANNEL: process.env.RULES_CHANNEL || '1460390628058730557',
    JOBS_CHANNEL: process.env.JOBS_CHANNEL || '1460389586034491545',
    COMMANDS_CHANNEL: process.env.COMMANDS_CHANNEL || '1460713211874512978',
    WELCOME_IMAGE: process.env.WELCOME_IMAGE || 'https://i.imgur.com/YourImageLink.png',
    STAFF_ROLES: (process.env.STAFF_ROLES || '1460738255606779997,1460738340985769994,1460739568243445967,1460738960035938609,1460740135833567386').split(',')
};

// Stockage des données
let jobsData = [];
let ticketsData = {};

// Charger les données sauvegardées
function loadData() {
    try {
        if (fs.existsSync('jobs.json')) {
            jobsData = JSON.parse(fs.readFileSync('jobs.json', 'utf8'));
        }
        if (fs.existsSync('tickets.json')) {
            ticketsData = JSON.parse(fs.readFileSync('tickets.json', 'utf8'));
        }
        console.log('✅ Données chargées avec succès');
    } catch (error) {
        console.error('⚠️ Erreur lors du chargement des données:', error);
    }
}

// Sauvegarder les données
function saveData() {
    try {
        fs.writeFileSync('jobs.json', JSON.stringify(jobsData, null, 2));
        fs.writeFileSync('tickets.json', JSON.stringify(ticketsData, null, 2));
    } catch (error) {
        console.error('⚠️ Erreur lors de la sauvegarde des données:', error);
    }
}

client.once('ready', async () => {
    console.log('═══════════════════════════════════════');
    console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
    console.log(`📊 Connecté sur ${client.guilds.cache.size} serveur(s)`);
    console.log(`👥 ${client.users.cache.size} utilisateurs visibles`);
    console.log('═══════════════════════════════════════');
    
    loadData();
    
    // Enregistrer les commandes slash
    const commands = [
        {
            name: 'regle',
            description: 'Affiche le règlement du serveur'
        },
        {
            name: 'jobs_setup',
            description: 'Configure le système de jobs (Admin uniquement)'
        },
        {
            name: 'jobs',
            description: 'Affiche la liste des jobs disponibles'
        },
        {
            name: 'deljobs',
            description: 'Supprime le message de la liste des jobs (Admin uniquement)'
        },
        {
            name: 'command',
            description: 'Affiche la liste des commandes du bot'
        }
    ];

    try {
        await client.application.commands.set(commands);
        console.log('✅ Commandes slash enregistrées');
    } catch (error) {
        console.error('❌ Erreur lors de l\'enregistrement des commandes:', error);
    }

    // Définir le statut du bot
    client.user.setPresence({
        activities: [{ name: 'Vanesty RP | Légal 🎮', type: 0 }],
        status: 'online',
    });
});

// ==================== SYSTÈME DE BIENVENUE ====================
client.on('guildMemberAdd', async (member) => {
    const channel = member.guild.channels.cache.get(CONFIG.WELCOME_CHANNEL);
    if (!channel) {
        console.log('⚠️ Canal de bienvenue introuvable');
        return;
    }

    try {
        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🎉 BIENVENUE SUR VANESTY RP')
            .setDescription(`Bienvenue ${member} sur **Vanesty RP | Légal** !\n\nNous sommes ravis de t'accueillir dans notre communauté !`)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
            .setImage(CONFIG.WELCOME_IMAGE)
            .addFields(
                { name: '👤 Membre', value: `${member.user.tag}`, inline: true },
                { name: '📊 Membre n°', value: `${member.guild.memberCount}`, inline: true },
                { name: '📅 Compte créé le', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:D>`, inline: true },
                { name: '📜 Règlement', value: `Consulte le règlement dans <#${CONFIG.RULES_CHANNEL}>`, inline: false }
            )
            .setFooter({ text: 'Vanesty RP | Légal', iconURL: member.guild.iconURL() })
            .setTimestamp();

        await channel.send({ embeds: [embed] });
        console.log(`✅ Message de bienvenue envoyé pour ${member.user.tag}`);
    } catch (error) {
        console.error('❌ Erreur lors de l\'envoi du message de bienvenue:', error);
    }
});

// ==================== SYSTÈME D'ANNONCES ====================
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    
    if (message.channel.id === CONFIG.ANNOUNCE_CHANNEL) {
        const content = message.content;
        
        try {
            await message.delete();

            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('📢 NOUVELLE ANNONCE')
                .setDescription(content)
                .setAuthor({ 
                    name: message.author.tag, 
                    iconURL: message.author.displayAvatarURL({ dynamic: true }) 
                })
                .setFooter({ text: `Annoncé par ${message.author.tag}` })
                .setTimestamp();

            await message.channel.send({ 
                content: '@everyone',
                embeds: [embed] 
            });
            
            console.log(`📢 Annonce publiée par ${message.author.tag}`);
        } catch (error) {
            console.error('❌ Erreur lors de l\'annonce:', error);
        }
    }
});

// ==================== SYSTÈME DE TICKETS ====================
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.channel.id !== CONFIG.TICKET_CHANNEL) return;

    try {
        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('🎫 SYSTÈME DE TICKETS')
            .setDescription('**Sélectionnez le type de ticket que vous souhaitez créer :**\n\nUn membre du staff prendra en charge votre demande dans les plus brefs délais.')
            .addFields(
                { name: '🏢 Reprise d\'entreprise', value: 'Pour les demandes de reprise d\'entreprise', inline: false },
                { name: '❓ Autres', value: 'Pour toute autre demande', inline: false }
            )
            .setFooter({ text: 'Vanesty RP | Légal' })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('ticket_type')
                    .setPlaceholder('Choisissez un type de ticket')
                    .addOptions([
                        {
                            label: 'Reprise d\'entreprise',
                            description: 'Demande de reprise d\'entreprise',
                            value: 'reprise',
                            emoji: '🏢'
                        },
                        {
                            label: 'Autres',
                            description: 'Autre demande',
                            value: 'autres',
                            emoji: '❓'
                        }
                    ])
            );

        await message.channel.send({ embeds: [embed], components: [row] });
    } catch (error) {
        console.error('❌ Erreur lors de la création du message de ticket:', error);
    }
});

// Gestion de la sélection du type de ticket
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isStringSelectMenu()) return;
    
    if (interaction.customId === 'ticket_type') {
        const type = interaction.values[0];
        const typeName = type === 'reprise' ? 'Reprise d\'entreprise' : 'Autres';
        
        try {
            // Créer le canal de ticket
            const ticketChannel = await interaction.guild.channels.create({
                name: `ticket-${interaction.user.username}`,
                type: ChannelType.GuildText,
                parent: CONFIG.TICKET_CATEGORY,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: interaction.user.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
                    },
                    ...CONFIG.STAFF_ROLES.map(roleId => ({
                        id: roleId,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels]
                    }))
                ]
            });

            ticketsData[ticketChannel.id] = {
                owner: interaction.user.id,
                type: typeName,
                takenBy: null,
                additionalUsers: [],
                createdAt: Date.now()
            };
            saveData();

            const ticketEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle(`🎫 Ticket: ${typeName}`)
                .setDescription(`**Ticket créé par ${interaction.user}**\n\nMerci d'avoir créé un ticket. Un membre du staff va prendre en charge votre demande sous peu.\n\n**Type:** ${typeName}\n**Statut:** En attente`)
                .setFooter({ text: 'Vanesty RP | Légal' })
                .setTimestamp();

            const ticketRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('take_ticket')
                        .setLabel('Prendre en charge')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('✋'),
                    new ButtonBuilder()
                        .setCustomId('add_user')
                        .setLabel('Ajouter un utilisateur')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('➕'),
                    new ButtonBuilder()
                        .setCustomId('close_ticket')
                        .setLabel('Fermer le ticket')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('🔒')
                );

            await ticketChannel.send({ 
                content: `${interaction.user} | ${CONFIG.STAFF_ROLES.map(id => `<@&${id}>`).join(' ')}`,
                embeds: [ticketEmbed], 
                components: [ticketRow] 
            });
            
            await interaction.reply({ content: `✅ Ticket créé avec succès : ${ticketChannel}`, ephemeral: true });
            console.log(`🎫 Ticket créé par ${interaction.user.tag} - Type: ${typeName}`);
        } catch (error) {
            console.error('❌ Erreur lors de la création du ticket:', error);
            await interaction.reply({ content: '❌ Une erreur est survenue lors de la création du ticket.', ephemeral: true });
        }
    }
});

// Gestion des boutons de tickets
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    const ticketData = ticketsData[interaction.channel.id];
    if (!ticketData) return;

    try {
        // Prendre en charge le ticket
        if (interaction.customId === 'take_ticket') {
            const hasStaffRole = CONFIG.STAFF_ROLES.some(roleId => 
                interaction.member.roles.cache.has(roleId)
            );

            if (!hasStaffRole) {
                return interaction.reply({ content: '❌ Vous n\'avez pas la permission de prendre en charge ce ticket.', ephemeral: true });
            }

            ticketData.takenBy = interaction.user.id;
            saveData();

            const embed = new EmbedBuilder()
                .setColor('#0099FF')
                .setDescription(`✅ **Ticket pris en charge par ${interaction.user}**\n\nVotre demande est maintenant traitée par un membre du staff.`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            console.log(`✋ Ticket pris en charge par ${interaction.user.tag}`);
        }

        // Ajouter un utilisateur
        if (interaction.customId === 'add_user') {
            const hasStaffRole = CONFIG.STAFF_ROLES.some(roleId => 
                interaction.member.roles.cache.has(roleId)
            );

            if (!hasStaffRole) {
                return interaction.reply({ content: '❌ Vous n\'avez pas la permission d\'ajouter des utilisateurs.', ephemeral: true });
            }

            const modal = new ModalBuilder()
                .setCustomId('add_user_modal')
                .setTitle('Ajouter un utilisateur au ticket');

            const userIdInput = new TextInputBuilder()
                .setCustomId('user_id')
                .setLabel('ID de l\'utilisateur')
                .setPlaceholder('Exemple: 123456789012345678')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const row = new ActionRowBuilder().addComponents(userIdInput);
            modal.addComponents(row);

            await interaction.showModal(modal);
        }

        // Fermer le ticket
        if (interaction.customId === 'close_ticket') {
            const isOwner = ticketData.owner === interaction.user.id;
            const hasStaffRole = CONFIG.STAFF_ROLES.some(roleId => 
                interaction.member.roles.cache.has(roleId)
            );

            if (!isOwner && !hasStaffRole) {
                return interaction.reply({ content: '❌ Vous n\'avez pas la permission de fermer ce ticket.', ephemeral: true });
            }

            const confirmEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🔒 Fermeture du ticket')
                .setDescription('Ce ticket sera fermé dans **5 secondes**...')
                .setFooter({ text: 'Vanesty RP | Légal' })
                .setTimestamp();

            await interaction.reply({ embeds: [confirmEmbed] });
            
            setTimeout(async () => {
                try {
                    delete ticketsData[interaction.channel.id];
                    saveData();
                    await interaction.channel.delete();
                    console.log(`🔒 Ticket fermé par ${interaction.user.tag}`);
                } catch (error) {
                    console.error('❌ Erreur lors de la fermeture du ticket:', error);
                }
            }, 5000);
        }
    } catch (error) {
        console.error('❌ Erreur lors de la gestion du bouton:', error);
    }
});

// Gestion du modal d'ajout d'utilisateur
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isModalSubmit()) return;

    if (interaction.customId === 'add_user_modal') {
        const userId = interaction.fields.getTextInputValue('user_id');
        
        try {
            const user = await interaction.guild.members.fetch(userId);
            
            await interaction.channel.permissionOverwrites.create(user, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true
            });

            ticketsData[interaction.channel.id].additionalUsers.push(userId);
            saveData();

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setDescription(`✅ ${user} a été ajouté au ticket avec succès.`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            console.log(`➕ ${user.user.tag} ajouté au ticket par ${interaction.user.tag}`);
        } catch (error) {
            console.error('❌ Erreur lors de l\'ajout de l\'utilisateur:', error);
            await interaction.reply({ content: '❌ Utilisateur introuvable. Vérifiez l\'ID fourni.', ephemeral: true });
        }
    }
});

// ==================== COMMANDES SLASH ====================
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    try {
        // Commande /regle
        if (interaction.commandName === 'regle') {
            const channel = interaction.guild.channels.cache.get(CONFIG.RULES_CHANNEL);
            
            if (!channel) {
                return interaction.reply({ content: '❌ Canal de règlement introuvable.', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('📜 RÈGLEMENT VANESTY RP')
                .setDescription('**Bienvenue sur Vanesty RP | Légal !**\n\nPour garantir une expérience agréable à tous, veuillez lire et respecter notre règlement complet.\n\n**📖 Consultez le règlement complet ici :**\nhttps://valestia-rp-or-free-access.gitbook.io/valestafa/\n\n⚠️ **Le non-respect du règlement peut entraîner des sanctions.**')
                .setFooter({ text: 'Vanesty RP | Légal' })
                .setTimestamp();

            await channel.send({ embeds: [embed] });
            await interaction.reply({ content: `✅ Règlement envoyé dans ${channel} !`, ephemeral: true });
            console.log(`📜 Règlement publié par ${interaction.user.tag}`);
        }

        // Commande /jobs_setup
        if (interaction.commandName === 'jobs_setup') {
            if (interaction.channel.id !== CONFIG.JOBS_CHANNEL) {
                return interaction.reply({ content: `❌ Cette commande ne peut être utilisée que dans <#${CONFIG.JOBS_CHANNEL}>.`, ephemeral: true });
            }

            const hasStaffRole = CONFIG.STAFF_ROLES.some(roleId => 
                interaction.member.roles.cache.has(roleId)
            );

            if (!hasStaffRole && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({ content: '❌ Vous n\'avez pas la permission d\'utiliser cette commande.', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('🏢 DASHBOARD DE GESTION DES JOBS')
                .setDescription('**Gérez les entreprises du serveur**\n\nUtilisez les boutons ci-dessous pour créer, consulter ou supprimer des entreprises.')
                .addFields(
                    { name: '➕ Créer un job', value: 'Ajouter une nouvelle entreprise', inline: false },
                    { name: '📋 Liste des jobs', value: 'Voir toutes les entreprises enregistrées', inline: false },
                    { name: '🗑️ Supprimer un job', value: 'Retirer une entreprise de la liste', inline: false }
                )
                .setFooter({ text: 'Vanesty RP | Légal' })
                .setTimestamp();

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('create_job')
                        .setLabel('Créer un job')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('➕'),
                    new ButtonBuilder()
                        .setCustomId('list_jobs')
                        .setLabel('Liste des jobs')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('📋'),
                    new ButtonBuilder()
                        .setCustomId('delete_job')
                        .setLabel('Supprimer un job')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('🗑️')
                );

            await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
            console.log(`🏢 Dashboard jobs ouvert par ${interaction.user.tag}`);
        }

        // Commande /jobs
        if (interaction.commandName === 'jobs') {
            if (jobsData.length === 0) {
                return interaction.reply({ content: '❌ Aucune entreprise enregistrée pour le moment.', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('🏢 LISTE DES ENTREPRISES DISPONIBLES')
                .setDescription('**Découvrez toutes les entreprises de Vanesty RP !**\n\nCliquez sur le lien Discord pour rejoindre l\'entreprise de votre choix.')
                .setFooter({ text: `Vanesty RP | Légal • ${jobsData.length} entreprise(s)` })
                .setTimestamp();

            jobsData.forEach((job, index) => {
                const patronText = job.patron ? `👤 **Patron:** ${job.patron}` : '👤 **Patron:** Aucun (Poste disponible)';
                embed.addFields({
                    name: `${index + 1}. ${job.name}`,
                    value: `${patronText}\n🔗 **Discord:** [Rejoindre](${job.discord})`,
                    inline: false
                });
            });

            await interaction.reply({ embeds: [embed] });
            console.log(`📋 Liste des jobs affichée par ${interaction.user.tag}`);
        }

        // Commande /deljobs
        if (interaction.commandName === 'deljobs') {
            const hasStaffRole = CONFIG.STAFF_ROLES.some(roleId => 
                interaction.member.roles.cache.has(roleId)
            );

            if (!hasStaffRole && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({ content: '❌ Vous n\'avez pas la permission d\'utiliser cette commande.', ephemeral: true });
            }

            const messages = await interaction.channel.messages.fetch({ limit: 50 });
            const jobMessages = messages.filter(m => 
                m.author.id === client.user.id && 
                m.embeds.length > 0 && 
                m.embeds[0].title === '🏢 LISTE DES ENTREPRISES DISPONIBLES'
            );

            if (jobMessages.size === 0) {
                return interaction.reply({ content: '❌ Aucun message de jobs trouvé dans ce salon.', ephemeral: true });
            }

            await Promise.all(jobMessages.map(m => m.delete()));
            await interaction.reply({ content: `✅ ${jobMessages.size} message(s) de jobs supprimé(s) avec succès.`, ephemeral: true });
            console.log(`🗑️ Messages de jobs supprimés par ${interaction.user.tag}`);
        }

        // Commande /command
        if (interaction.commandName === 'command') {
            const channel = interaction.guild.channels.cache.get(CONFIG.COMMANDS_CHANNEL);
            
            if (!channel) {
                return interaction.reply({ content: '❌ Canal de commandes introuvable.', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setColor('#0099FF')
                .setTitle('📋 COMMANDES DU BOT VANESTY')
                .setDescription('**Guide complet des fonctionnalités du bot**\n\nVoici toutes les commandes et systèmes disponibles :')
                .addFields(
                    { 
                        name: '🎉 Système de Bienvenue', 
                        value: '**Automatique** - Message de bienvenue personnalisé avec image lors de l\'arrivée d\'un nouveau membre.', 
                        inline: false 
                    },
                    { 
                        name: '📢 Système d\'Annonces', 
                        value: `**Automatique** - Envoyez un message dans <#${CONFIG.ANNOUNCE_CHANNEL}> pour qu\'il soit formaté et ping @everyone automatiquement.`, 
                        inline: false 
                    },
                    { 
                        name: '🎫 Système de Tickets', 
                        value: `**Interactif** - Créez un ticket dans <#${CONFIG.TICKET_CHANNEL}> pour "Reprise d\'entreprise" ou "Autres". Le staff peut prendre en charge et ajouter des utilisateurs.`, 
                        inline: false 
                    },
                    { 
                        name: '`/regle`', 
                        value: `Publie le règlement du serveur dans <#${CONFIG.RULES_CHANNEL}>.`, 
                        inline: true 
                    },
                    { 
                        name: '`/jobs_setup`', 
                        value: 'Ouvre le dashboard de gestion des entreprises (Admin/Staff uniquement).', 
                        inline: true 
                    },
                    { 
                        name: '`/jobs`', 
                        value: 'Affiche la liste complète des entreprises avec leurs patrons et liens Discord.', 
                        inline: true 
                    },
                    { 
                        name: '`/deljobs`', 
                        value: 'Supprime les anciens messages de la liste des jobs (Admin/Staff uniquement).', 
                        inline: true 
                    },
                    { 
                        name: '`/command`', 
                        value: 'Affiche cette liste de commandes et fonctionnalités.', 
                        inline: true 
                    }
                )
                .setFooter({ text: 'Vanesty RP | Légal • Bot développé pour votre serveur' })
                .setTimestamp();

            await channel.send({ embeds: [embed] });
            await interaction.reply({ content: `✅ Liste des commandes envoyée dans ${channel} !`, ephemeral: true });
            console.log(`📋 Liste des commandes publiée par ${interaction.user.tag}`);
        }
    } catch (error) {
        console.error('❌ Erreur lors de l\'exécution de la commande:', error);
        if (!interaction.replied) {
            await interaction.reply({ content: '❌ Une erreur est survenue lors de l\'exécution de la commande.', ephemeral: true });
        }
    }
});

// Gestion des boutons du dashboard jobs
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    try {
        // Créer un job
        if (interaction.customId === 'create_job') {
            const modal = new ModalBuilder()
                .setCustomId('create_job_modal')
                .setTitle('Créer une nouvelle entreprise');

            const nameInput = new TextInputBuilder()
                .setCustomId('job_name')
                .setLabel('Nom de l\'entreprise')
                .setPlaceholder('Exemple: Los Santos Customs')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMaxLength(100);

            const discordInput = new TextInputBuilder()
                .setCustomId('job_discord')
                .setLabel('Lien du serveur Discord')
                .setPlaceholder('Exemple: https://discord.gg/exemple')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const patronInput = new TextInputBuilder()
                .setCustomId('job_patron')
                .setLabel('Nom du patron (laisser vide si aucun)')
                .setPlaceholder('Exemple: John Doe')
                .setStyle(TextInputStyle.Short)
                .setRequired(false)
                .setMaxLength(50);

            modal.addComponents(
                new ActionRowBuilder().addComponents(nameInput),
                new ActionRowBuilder().addComponents(discordInput),
                new ActionRowBuilder().addComponents(patronInput)
            );

            await interaction.showModal(modal);
        }

        // Lister les jobs
        if (interaction.customId === 'list_jobs') {
            if (jobsData.length === 0) {
                return interaction.reply({ content: '❌ Aucune entreprise enregistrée pour le moment.', ephemeral: true });
            }

            let jobsList = '**📋 Liste des entreprises enregistrées:**\n\n';
            jobsData.forEach((job, index) => {
                jobsList += `**${index + 1}.** ${job.name}\n`;
                jobsList += `   └ Patron: ${job.patron || 'Aucun'}\n`;
                jobsList += `   └ Discord: ${job.discord}\n\n`;
            });

            await interaction.reply({ content: jobsList, ephemeral: true });
        }

        // Supprimer un job
        if (interaction.customId === 'delete_job') {
            if (jobsData.length === 0) {
                return interaction.reply({ content: '❌ Aucune entreprise à supprimer.', ephemeral: true });
            }

            const modal = new ModalBuilder()
                .setCustomId('delete_job_modal')
                .setTitle('Supprimer une entreprise');

            const indexInput = new TextInputBuilder()
                .setCustomId('job_index')
                .setLabel('Numéro de l\'entreprise à supprimer')
                .setPlaceholder('Entrez le numéro (ex: 1, 2, 3...)')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(indexInput));
            await interaction.showModal(modal);
        }
    } catch (error) {
        console.error('❌ Erreur lors de la gestion du bouton:', error);
    }
});

// Gestion des modals
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isModalSubmit()) return;

    try {
        // Modal de création de job
        if (interaction.customId === 'create_job_modal') {
            const name = interaction.fields.getTextInputValue('job_name');
            const discord = interaction.fields.getTextInputValue('job_discord');
            const patron = interaction.fields.getTextInputValue('job_patron') || null;

            jobsData.push({ name, discord, patron });
            saveData();

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('✅ Entreprise Créée')
                .setDescription(`L'entreprise **${name}** a été ajoutée avec succès !`)
                .addFields(
                    { name: 'Nom', value: name, inline: true },
                    { name: 'Patron', value: patron || 'Aucun', inline: true },
                    { name: 'Discord', value: discord, inline: false }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
            console.log(`✅ Entreprise créée: ${name} par ${interaction.user.tag}`);
        }

        // Modal de suppression de job
        if (interaction.customId === 'delete_job_modal') {
            const index = parseInt(interaction.fields.getTextInputValue('job_index')) - 1;

            if (index < 0 || index >= jobsData.length) {
                return interaction.reply({ content: '❌ Numéro d\'entreprise invalide. Vérifiez la liste des entreprises.', ephemeral: true });
            }

            const deleted = jobsData.splice(index, 1)[0];
            saveData();

            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🗑️ Entreprise Supprimée')
                .setDescription(`L'entreprise **${deleted.name}** a été supprimée avec succès.`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
            console.log(`🗑️ Entreprise supprimée: ${deleted.name} par ${interaction.user.tag}`);
        }
    } catch (error) {
        console.error('❌ Erreur lors de la gestion du modal:', error);
        if (!interaction.replied) {
            await interaction.reply({ content: '❌ Une erreur est survenue lors du traitement de votre demande.', ephemeral: true });
        }
    }
});

// Gestion des erreurs globales
process.on('unhandledRejection', error => {
    console.error('❌ Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
    console.error('❌ Uncaught exception:', error);
});

// Message de démarrage
console.log('═══════════════════════════════════════');
console.log('🚀 Démarrage du bot Vanesty...');
console.log('═══════════════════════════════════════');

// Connexion du bot avec gestion d'erreur
const token = process.env.DISCORD_TOKEN;

if (!token) {
    console.error('❌ ERREUR CRITIQUE: Token Discord manquant !');
    console.error('⚠️  Ajoutez DISCORD_TOKEN dans vos variables d\'environnement');
    process.exit(1);
}

client.login(token).catch(error => {
    console.error('❌ Erreur de connexion au bot Discord:', error);
    console.error('⚠️  Vérifiez que votre token est valide');
    process.exit(1);
});