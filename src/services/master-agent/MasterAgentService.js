// Service Master Agent pour la création d'agents IA
const OpenAI = require('openai');

class MasterAgentService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // Templates d'agents prédéfinis
    this.agentTemplates = {
      support: {
        name: "Agent Support Client",
        description: "Agent spécialisé dans le support client et la résolution de problèmes",
        capabilities: [
          "Répondre aux questions clients",
          "Résoudre les problèmes techniques",
          "Escalader vers un humain si nécessaire",
          "Maintenir un historique des interactions"
        ],
        personality: {
          tone: "friendly",
          expertise_level: "expert",
          proactivity: 80,
          response_style: "conversational"
        },
        systemPrompt: `Tu es un agent de support client professionnel et empathique. 
        Ton rôle est d'aider les clients à résoudre leurs problèmes rapidement et efficacement.
        Sois toujours poli, patient et orienté solution.`
      },
      
      sales: {
        name: "Agent Commercial",
        description: "Agent spécialisé dans la vente et la génération de leads",
        capabilities: [
          "Qualifier les prospects",
          "Présenter les produits/services",
          "Répondre aux objections",
          "Planifier des rendez-vous commerciaux"
        ],
        personality: {
          tone: "professional",
          expertise_level: "expert",
          proactivity: 90,
          response_style: "detailed"
        },
        systemPrompt: `Tu es un commercial expérimenté et persuasif.
        Ton objectif est de comprendre les besoins du prospect et de proposer la meilleure solution.
        Sois consultatif, pas agressif.`
      },
      
      marketing: {
        name: "Agent Marketing",
        description: "Agent spécialisé dans le marketing et la création de contenu",
        capabilities: [
          "Créer du contenu marketing",
          "Gérer les campagnes",
          "Analyser les performances",
          "Optimiser le SEO"
        ],
        personality: {
          tone: "casual",
          expertise_level: "expert",
          proactivity: 70,
          response_style: "detailed"
        },
        systemPrompt: `Tu es un expert en marketing digital et création de contenu.
        Tu aides les entreprises à développer leur présence en ligne et à attirer plus de clients.
        Sois créatif et orienté résultats.`
      }
    };
    
    // Questions de découverte par catégorie
    this.discoveryQuestions = {
      business_type: [
        "Quel est votre secteur d'activité ?",
        "Que vendez-vous ou quel service proposez-vous ?",
        "Quelle est la taille de votre entreprise ?"
      ],
      challenges: [
        "Quels sont vos principaux défis quotidiens ?",
        "Quelles tâches vous prennent le plus de temps ?",
        "Avez-vous des problèmes récurrents avec vos clients ?"
      ],
      goals: [
        "Que souhaitez-vous accomplir avec un agent IA ?",
        "Quels sont vos objectifs business prioritaires ?",
        "Combien de temps voulez-vous économiser par jour ?"
      ],
      integrations: [
        "Quels outils utilisez-vous actuellement ? (CRM, email, calendrier, etc.)",
        "Avez-vous un site web ou des réseaux sociaux ?",
        "Comment gérez-vous vos clients actuellement ?"
      ]
    };
  }

  // Analyser l'intention de l'utilisateur
  async analyzeUserIntent(message, conversationHistory = []) {
    try {
      // Détection simple basée sur des mots-clés
      const createAgentKeywords = [
        'créer', 'agent', 'ia', 'intelligence artificielle', 'chatbot', 'bot',
        'automatiser', 'assistant', 'entreprise', 'business', 'secteur', 'activité',
        'restaurant', 'commerce', 'service', 'client', 'support', 'vente'
      ];
      
      const messageLower = message.toLowerCase();
      const hasCreateIntent = createAgentKeywords.some(keyword => 
        messageLower.includes(keyword)
      );
      
      if (hasCreateIntent) {
        // Extraire le type d'activité si mentionné
        let businessType = null;
        if (messageLower.includes('restaurant') || messageLower.includes('restauration')) {
          businessType = 'restauration';
        } else if (messageLower.includes('commerce') || messageLower.includes('boutique')) {
          businessType = 'commerce';
        } else if (messageLower.includes('service') || messageLower.includes('conseil')) {
          businessType = 'services';
        }
        
        return {
          intent: "create_agent",
          business_type: businessType,
          confidence: 0.8,
          next_action: businessType ? "ask_challenges" : "ask_business_type"
        };
      }
      
      // Si on est dans un processus de création d'agent (contexte existant), continuer
      if (conversationHistory.length > 0 || messageLower.includes('google') || messageLower.includes('gmail') || messageLower.includes('calendar')) {
        return {
          intent: "create_agent",
          business_type: null,
          confidence: 0.6,
          next_action: "continue_discovery"
        };
      }
      
      return {
        intent: "other",
        confidence: 0.0,
        next_action: "continue_chat"
      };
    } catch (error) {
      console.error('Erreur analyse intention:', error);
      return {
        intent: "other",
        confidence: 0.0,
        next_action: "continue_chat"
      };
    }
  }

  // Obtenir la prochaine question de découverte
  getNextDiscoveryQuestion(context) {
    const { business_type, challenges, goals, integrations } = context;
    
    if (!business_type) {
      return {
        question: this.discoveryQuestions.business_type[0],
        category: "business_type",
        context: "Je vais vous aider à créer un agent IA personnalisé. Commençons par comprendre votre activité."
      };
    }
    
    if (!challenges) {
      return {
        question: this.discoveryQuestions.challenges[0],
        category: "challenges",
        context: "Parfait ! Maintenant, parlons de vos défis quotidiens."
      };
    }
    
    if (!goals) {
      return {
        question: this.discoveryQuestions.goals[0],
        category: "goals",
        context: "Excellent ! Quels sont vos objectifs avec cet agent IA ?"
      };
    }
    
    if (!integrations) {
      return {
        question: this.discoveryQuestions.integrations[0],
        category: "integrations",
        context: "Dernière étape : quels outils utilisez-vous ?"
      };
    }
    
    return null; // Toutes les informations sont collectées
  }

  // Générer un agent basé sur les informations collectées
  async generateAgent(context) {
    try {
      const { business_type, challenges, goals, integrations } = context;
      
      // Déterminer le type d'agent le plus approprié
      const agentType = this.determineAgentType(business_type, challenges, goals);
      const template = this.agentTemplates[agentType];
      
      // Personnaliser le template
      const customAgent = {
        ...template,
        name: `${template.name} - ${business_type}`,
        description: `${template.description} pour ${business_type}`,
        systemPrompt: `${template.systemPrompt}\n\nContexte spécifique: ${business_type}\nDéfis identifiés: ${challenges}\nObjectifs: ${goals}\nIntégrations: ${integrations}`,
        customizations: {
          business_type,
          challenges,
          goals,
          integrations,
          created_at: new Date().toISOString()
        }
      };
      
      return {
        success: true,
        agent: customAgent,
        recommendations: this.getRecommendations(agentType, context)
      };
    } catch (error) {
      console.error('Erreur génération agent:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Nouvelle méthode pour sauvegarder l'agent généré
  async saveGeneratedAgent(agentData, tenantId, userId) {
    try {
      // Appel à l'API pour sauvegarder l'agent
      const response = await fetch('http://localhost:3002/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.JWT_SECRET || 'demo-token'}`,
          'X-Tenant-ID': tenantId,
          'X-User-ID': userId
        },
        body: JSON.stringify({
          name: agentData.name,
          description: agentData.description,
          type: agentData.type || 'custom',
          personality: {
            tone: 'friendly',
            expertise_level: 'intermediate',
            proactivity: 7
          },
          capabilities: agentData.capabilities || [],
          integrations: agentData.integrations || [],
          system_prompt: agentData.systemPrompt,
          metadata: {
            generated_by: 'master_agent',
            ...agentData.customizations
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur sauvegarde agent: ${response.status}`);
      }

      const savedAgent = await response.json();
      console.log('✅ Agent sauvegardé avec succès:', savedAgent.data.id);
      
      return {
        success: true,
        agent: savedAgent.data,
        message: 'Agent créé et sauvegardé avec succès !'
      };
    } catch (error) {
      console.error('❌ Erreur sauvegarde agent:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Déterminer le type d'agent le plus approprié
  determineAgentType(business_type, challenges, goals) {
    const text = `${business_type} ${challenges} ${goals}`.toLowerCase();
    
    if (text.includes('support') || text.includes('client') || text.includes('problème') || text.includes('aide')) {
      return 'support';
    }
    
    if (text.includes('vente') || text.includes('commercial') || text.includes('lead') || text.includes('prospect')) {
      return 'sales';
    }
    
    if (text.includes('marketing') || text.includes('contenu') || text.includes('campagne') || text.includes('seo')) {
      return 'marketing';
    }
    
    // Par défaut, support
    return 'support';
  }

  // Obtenir des recommandations
  getRecommendations(agentType, context) {
    const recommendations = {
      support: [
        "Intégrez votre CRM pour un historique client complet",
        "Configurez des réponses automatiques pour les questions fréquentes",
        "Ajoutez un système d'escalade vers vos équipes"
      ],
      sales: [
        "Connectez votre CRM pour le suivi des prospects",
        "Intégrez votre calendrier pour planifier des rendez-vous",
        "Configurez des séquences de nurturing automatiques"
      ],
      marketing: [
        "Intégrez vos réseaux sociaux pour la publication automatique",
        "Connectez Google Analytics pour le suivi des performances",
        "Ajoutez des outils de création de contenu"
      ]
    };
    
    return recommendations[agentType] || recommendations.support;
  }

  // Traiter un message du Master Agent
  async processMessage(message, conversationHistory = [], context = {}) {
    try {
      // Analyser l'intention
      const intent = await this.analyzeUserIntent(message, conversationHistory);
      
      if (intent.intent === 'create_agent') {
        // Mettre à jour le contexte avec les nouvelles informations
        if (intent.business_type) context.business_type = intent.business_type;
        
        // Extraire des informations du message pour enrichir le contexte
        this.extractContextFromMessage(message, context);
        
        // Debug: afficher le contexte
        console.log('🔍 Contexte actuel:', context);
        
        // Vérifier si toutes les informations sont collectées
        const hasAllInfo = context.business_type && context.challenges && context.goals && context.integrations;
        console.log('✅ Toutes les infos collectées:', hasAllInfo);
        
        if (hasAllInfo) {
          // Générer l'agent directement
          const agentResult = await this.generateAgent(context);
          
          if (agentResult.success) {
            return {
              type: 'agent_generated',
              message: `🎉 Parfait ! J'ai créé votre agent IA personnalisé : "${agentResult.agent.name}"\n\n${agentResult.agent.description}\n\nCapacités :\n${agentResult.agent.capabilities.map(cap => `• ${cap}`).join('\n')}\n\nRecommandations :\n${agentResult.recommendations.map(rec => `• ${rec}`).join('\n')}\n\nVoulez-vous déployer cet agent maintenant ?`,
              agent: agentResult.agent,
              context: context
            };
          } else {
            return {
              type: 'error',
              message: `Désolé, j'ai rencontré une erreur lors de la création de votre agent : ${agentResult.error}`
            };
          }
        } else {
          // Obtenir la prochaine question de découverte
          const nextQuestion = this.getNextDiscoveryQuestion(context);
          
          if (nextQuestion) {
            return {
              type: 'discovery_question',
              message: `${nextQuestion.context}\n\n${nextQuestion.question}`,
              context: context,
              category: nextQuestion.category
            };
          } else {
            // Fallback si pas de question mais pas toutes les infos
            return {
              type: 'discovery_question',
              message: 'Pouvez-vous me donner plus d\'informations sur votre entreprise et vos besoins ?',
              context: context
            };
          }
        }
      } else {
        // Conversation normale
        return {
          type: 'normal_chat',
          message: await this.getNormalResponse(message, conversationHistory),
          context: context
        };
      }
    } catch (error) {
      console.error('Erreur traitement message Master Agent:', error);
      return {
        type: 'error',
        message: 'Désolé, j\'ai rencontré une erreur. Pouvez-vous reformuler votre demande ?'
      };
    }
  }

  // Extraire des informations du message pour enrichir le contexte
  extractContextFromMessage(message, context) {
    const messageLower = message.toLowerCase();
    
    // Détecter les défis mentionnés
    if (messageLower.includes('défi') || messageLower.includes('problème') || messageLower.includes('difficulté') || messageLower.includes('réservation') || messageLower.includes('client')) {
      if (!context.challenges) {
        context.challenges = message;
      }
    }
    
    // Détecter les objectifs mentionnés
    if (messageLower.includes('objectif') || messageLower.includes('but') || messageLower.includes('souhaite') || messageLower.includes('automatiser') || messageLower.includes('améliorer')) {
      if (!context.goals) {
        context.goals = message;
      }
    }
    
    // Détecter les outils/intégrations mentionnés
    if (messageLower.includes('outil') || messageLower.includes('système') || messageLower.includes('logiciel') || 
        messageLower.includes('site web') || messageLower.includes('réservation en ligne') || 
        messageLower.includes('utilise') || messageLower.includes('j\'ai') ||
        messageLower.includes('google') || messageLower.includes('gmail') || 
        messageLower.includes('calendar') || messageLower.includes('calendrier')) {
      if (!context.integrations) {
        context.integrations = message;
      }
    }
  }

  // Réponse normale pour la conversation
  async getNormalResponse(message, conversationHistory) {
    try {
      const prompt = `Tu es AGENLY, un assistant IA spécialisé dans la création d'agents IA personnalisés pour les PME.

Ton rôle :
- Aider les utilisateurs à créer des agents IA adaptés à leur business
- Poser des questions pertinentes pour comprendre leurs besoins
- Proposer des solutions concrètes et personnalisées
- Être professionnel, créatif et à l'écoute

Si l'utilisateur veut créer un agent IA, guide-le avec des questions pour comprendre ses besoins.

Message: "${message}"

Réponds en français de manière naturelle et engageante.`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 300
      });

      return completion.choices[0]?.message?.content || 'Désolé, je n\'ai pas pu générer de réponse.';
    } catch (error) {
      console.error('Erreur réponse normale:', error);
      return 'Désolé, j\'ai rencontré une erreur. Pouvez-vous reformuler votre demande ?';
    }
  }
}

module.exports = MasterAgentService;




