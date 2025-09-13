import { OpenAIService } from './OpenAIService';

interface PromptPersonalization {
  businessType: string;
  name: string;
  objectives: string;
  personality: string;
  industry?: string;
  targetAudience?: string;
  tone?: string;
  specialties?: string[];
  integrations?: string[];
  features?: string[];
}

interface AdvancedPromptTemplate {
  id: string;
  name: string;
  category: string;
  template: string;
  variables: string[];
  examples: string[];
}

/**
 * Service avancé de génération de prompts personnalisés
 * Remplace les prompts génériques par des prompts hautement personnalisés
 */
export class AdvancedPromptService {
  private static instance: AdvancedPromptService;
  private openaiService: OpenAIService;
  private templates: Map<string, AdvancedPromptTemplate> = new Map();

  private constructor() {
    this.openaiService = new OpenAIService();
    this.initializeTemplates();
  }

  public static getInstance(): AdvancedPromptService {
    if (!AdvancedPromptService.instance) {
      AdvancedPromptService.instance = new AdvancedPromptService();
    }
    return AdvancedPromptService.instance;
  }

  /**
   * Initialiser les templates avancés
   */
  private initializeTemplates(): void {
    const templates: AdvancedPromptTemplate[] = [
      {
        id: 'restaurant_premium',
        name: 'Restaurant Premium',
        category: 'restaurant',
        template: `Tu es {{name}}, un assistant IA premium spécialisé dans l'excellence culinaire et le service client de haut niveau.

🎯 MISSION PRINCIPALE:
{{objectives}}

👥 TON EXPERTISE:
- Maître de l'art culinaire et de l'hospitalité
- Expert en recommandations personnalisées
- Spécialiste de l'expérience client premium
- Conseiller en accords mets-vins (si applicable)

🌟 PERSONNALITÉ: {{personality}}
Tu communiques avec élégance et sophistication, tout en restant chaleureux et accessible.

🔧 TES CAPACITÉS SPÉCIALISÉES:
{{#each specialties}}
- {{this}}
{{/each}}

💫 STYLE DE COMMUNICATION:
- Utilise un vocabulaire culinaire précis
- Propose des expériences, pas seulement des plats
- Personnalise chaque recommandation
- Crée un sentiment d'exclusivité

🎨 EXEMPLES D'INTERACTIONS:
• "Je vous recommande notre {{signature_dish}} accompagné de notre sélection de vins {{wine_region}}"
• "Pour une expérience inoubliable, puis-je vous suggérer notre menu dégustation ?"`,
        variables: ['name', 'objectives', 'personality', 'specialties', 'signature_dish', 'wine_region'],
        examples: [
          'Excellent service client avec recommandations personnalisées',
          'Gestion des réservations VIP',
          'Conseils culinaires experts'
        ]
      },
      {
        id: 'ecommerce_conversion',
        name: 'E-commerce Conversion Expert',
        category: 'ecommerce',
        template: `Tu es {{name}}, un assistant IA spécialisé dans la conversion et l'expérience d'achat optimisée.

🎯 MISSION: {{objectives}}

🛒 TON EXPERTISE:
- Psychologie d'achat et conversion
- Recommandations produits intelligentes
- Optimisation du parcours client
- Gestion des objections et hésitations

💡 PERSONNALITÉ: {{personality}}
Tu es persuasif sans être insistant, toujours centré sur la valeur pour le client.

🔍 TES TECHNIQUES AVANCÉES:
- Analyse comportementale en temps réel
- Cross-selling et up-selling stratégiques
- Gestion des abandons de panier
- Personnalisation basée sur l'historique

📊 MÉTHODES DE PERSUASION:
{{#each features}}
- {{this}}
{{/each}}

💬 EXEMPLES DE PERSUASION:
• "Basé sur vos préférences, ces 3 produits pourraient vous intéresser..."
• "Clients similaires ont également acheté..."
• "Stock limité: seulement {{stock_count}} restants"`,
        variables: ['name', 'objectives', 'personality', 'features', 'stock_count'],
        examples: [
          'Augmentation du panier moyen',
          'Réduction de l\'abandon de panier',
          'Recommandations personnalisées'
        ]
      },
      {
        id: 'healthcare_assistant',
        name: 'Assistant Santé Certifié',
        category: 'healthcare',
        template: `Tu es {{name}}, un assistant IA certifié pour l'accompagnement en santé et bien-être.

⚕️ MISSION: {{objectives}}

🩺 TON EXPERTISE MÉDICALE:
- Information médicale fiable et vérifiée
- Orientation vers les professionnels appropriés
- Suivi de bien-être personnalisé
- Prévention et sensibilisation

🔒 CONFIDENTIALITÉ ET ÉTHIQUE:
- Respect strict du secret médical
- Conformité HIPAA/RGPD
- Jamais de diagnostic direct
- Encouragement du suivi médical professionnel

👨‍⚕️ PERSONNALITÉ: {{personality}}
Tu es empathique, rassurant et toujours professionnel.

🎯 TES COMPÉTENCES:
{{#each specialties}}
- {{this}}
{{/each}}

⚠️ LIMITES IMPORTANTES:
- Tu ne remplaces JAMAIS un médecin
- Tu orientes toujours vers des professionnels
- Tu fournis de l'information, pas des diagnostics

💬 EXEMPLES D'INTERACTIONS:
• "Ces symptômes nécessitent l'avis d'un professionnel. Puis-je vous aider à trouver un spécialiste ?"
• "Voici des informations fiables sur cette condition, source: {{medical_source}}"`,
        variables: ['name', 'objectives', 'personality', 'specialties', 'medical_source'],
        examples: [
          'Information médicale fiable',
          'Orientation professionnelle',
          'Suivi de bien-être'
        ]
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.id, template);
    });

    console.log('✅ Templates avancés initialisés:', this.templates.size);
  }

  /**
   * Générer un prompt hautement personnalisé avec IA
   */
  async generateAdvancedPrompt(personalization: PromptPersonalization): Promise<string> {
    console.log('🎨 Génération prompt avancé pour:', personalization.name);

    try {
      // 1. Sélectionner le template le plus approprié
      const template = this.selectBestTemplate(personalization);
      
      // 2. Générer le prompt de base avec le template
      let basePrompt = this.processTemplate(template, personalization);

      // 3. Enrichir avec l'IA pour plus de personnalisation
      const enhancedPrompt = await this.enhanceWithAI(basePrompt, personalization);

      console.log('✅ Prompt avancé généré avec succès');
      return enhancedPrompt;

    } catch (error) {
      console.error('❌ Erreur génération prompt avancé:', error);
      // Fallback vers un prompt amélioré
      return this.generateFallbackPrompt(personalization);
    }
  }

  /**
   * Sélectionner le meilleur template basé sur le business type
   */
  private selectBestTemplate(personalization: PromptPersonalization): AdvancedPromptTemplate {
    const businessType = personalization.businessType.toLowerCase();
    
    // Mapping intelligent des business types vers les templates
    const templateMapping: { [key: string]: string } = {
      'restaurant': 'restaurant_premium',
      'café': 'restaurant_premium',
      'bistro': 'restaurant_premium',
      'ecommerce': 'ecommerce_conversion',
      'boutique': 'ecommerce_conversion',
      'shop': 'ecommerce_conversion',
      'healthcare': 'healthcare_assistant',
      'santé': 'healthcare_assistant',
      'medical': 'healthcare_assistant'
    };

    const templateId = templateMapping[businessType] || 'restaurant_premium';
    const template = this.templates.get(templateId);

    return template || this.createGenericTemplate(personalization);
  }

  /**
   * Traiter le template avec les variables
   */
  private processTemplate(template: AdvancedPromptTemplate, personalization: PromptPersonalization): string {
    let processedPrompt = template.template;

    // Remplacer les variables de base
    processedPrompt = processedPrompt.replace(/\{\{name\}\}/g, personalization.name);
    processedPrompt = processedPrompt.replace(/\{\{objectives\}\}/g, personalization.objectives);
    processedPrompt = processedPrompt.replace(/\{\{personality\}\}/g, personalization.personality);

    // Traiter les listes (specialties, features)
    if (personalization.specialties) {
      const specialtiesList = personalization.specialties.map(s => `- ${s}`).join('\n');
      processedPrompt = processedPrompt.replace(/\{\{#each specialties\}\}.*?\{\{\/each\}\}/gs, specialtiesList);
    }

    if (personalization.features) {
      const featuresList = personalization.features.map(f => `- ${f}`).join('\n');
      processedPrompt = processedPrompt.replace(/\{\{#each features\}\}.*?\{\{\/each\}\}/gs, featuresList);
    }

    return processedPrompt;
  }

  /**
   * Enrichir le prompt avec l'IA
   */
  private async enhanceWithAI(basePrompt: string, personalization: PromptPersonalization): Promise<string> {
    const enhancementQuery = `
Améliore ce prompt système pour un agent IA spécialisé ${personalization.businessType}.

Prompt de base:
${basePrompt}

Contexte additionnel:
- Secteur: ${personalization.businessType}
- Objectifs: ${personalization.objectives}
- Public cible: ${personalization.targetAudience || 'clients généraux'}
- Intégrations: ${personalization.integrations?.join(', ') || 'aucune'}

Instructions:
1. Rends le prompt plus spécifique et personnalisé
2. Ajoute des exemples concrets d'interactions
3. Inclus des techniques de communication avancées
4. Garde un ton professionnel mais engageant
5. Maximum 800 mots

Réponds uniquement avec le prompt amélioré, sans commentaires.`;

    try {
      const completion = await this.openaiService.generateCompletion([
        { role: 'system', content: 'Tu es un expert en création de prompts système pour agents IA. Tu créés des prompts hautement personnalisés et efficaces.' },
        { role: 'user', content: enhancementQuery }
      ], { model: 'gpt-4o', temperature: 0.8, max_tokens: 1000 });

      return completion.trim();
    } catch (error) {
      console.error('Erreur enrichissement IA:', error);
      return basePrompt; // Fallback vers le prompt de base
    }
  }

  /**
   * Générer un prompt de fallback amélioré
   */
  private generateFallbackPrompt(personalization: PromptPersonalization): string {
    return `Tu es ${personalization.name}, un assistant IA expert spécialisé dans le domaine ${personalization.businessType}.

🎯 MISSION PRINCIPALE:
${personalization.objectives}

💡 PERSONNALITÉ: ${personalization.personality}

🔧 TES EXPERTISES:
- Expert reconnu dans le secteur ${personalization.businessType}
- Spécialiste de l'expérience client personnalisée
- Conseiller professionnel et stratégique
- Support technique et commercial avancé

🌟 APPROCHE UNIQUE:
- Tu analyses chaque situation de manière approfondie
- Tu proposes des solutions sur mesure
- Tu anticipes les besoins du client
- Tu crées une expérience mémorable

💬 STYLE DE COMMUNICATION:
- Professionnel mais chaleureux
- Précis et orienté solutions
- Proactif dans tes suggestions
- Toujours centré sur la valeur client

🎨 FONCTIONNALITÉS AVANCÉES:
${personalization.features?.map(f => `- ${f}`).join('\n') || '- Support client personnalisé\n- Conseils d\'expert\n- Solutions innovantes'}

Tu es prêt à offrir une expérience exceptionnelle ! Comment puis-je vous aider aujourd'hui ?`;
  }

  /**
   * Créer un template générique dynamique
   */
  private createGenericTemplate(personalization: PromptPersonalization): AdvancedPromptTemplate {
    return {
      id: 'generic_advanced',
      name: 'Template Avancé Générique',
      category: 'generic',
      template: `Tu es {{name}}, un assistant IA de nouvelle génération spécialisé dans {{businessType}}.

MISSION: {{objectives}}
PERSONNALITÉ: {{personality}}

Tu es un expert reconnu qui combine intelligence artificielle et expertise humaine.`,
      variables: ['name', 'businessType', 'objectives', 'personality'],
      examples: ['Support client avancé', 'Conseils personnalisés', 'Solutions innovantes']
    };
  }

  /**
   * Obtenir des recommandations de personnalisation
   */
  getPersonalizationRecommendations(businessType: string): string[] {
    const recommendations: { [key: string]: string[] } = {
      'restaurant': [
        'Spécialités culinaires locales',
        'Accords mets-vins',
        'Gestion des allergies alimentaires',
        'Recommandations saisonnières'
      ],
      'ecommerce': [
        'Recommandations produits IA',
        'Gestion des retours optimisée',
        'Cross-selling intelligent',
        'Support multicanal'
      ],
      'healthcare': [
        'Information médicale certifiée',
        'Orientation professionnelle',
        'Suivi de bien-être',
        'Confidentialité renforcée'
      ]
    };

    return recommendations[businessType.toLowerCase()] || [
      'Expertise sectorielle pointue',
      'Personnalisation avancée',
      'Support client premium',
      'Solutions innovantes'
    ];
  }
}

export default AdvancedPromptService.getInstance();




