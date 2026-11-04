import { DISTRICTS } from '../lib/constants';
import type { Need } from '../lib/generated/prisma/enums';

export type SeedRule =
  | {
      fact: 'age' | 'maritalStatus' | 'hasBplCard' | 'isShgMember' | 'pregnancy';
      op: 'eq';
      value: string;
      labelHi: string;
      labelEn: string;
    }
  | {
      fact: 'age' | 'maritalStatus' | 'hasBplCard' | 'isShgMember' | 'pregnancy';
      op: 'in';
      value: string[];
      labelHi: string;
      labelEn: string;
    }
  | {
      fact: 'age' | 'maritalStatus' | 'hasBplCard' | 'isShgMember' | 'pregnancy';
      op: 'between';
      value: [number, number];
      labelHi: string;
      labelEn: string;
    };

export type SeedSchemeContent = {
  lang: 'hi' | 'en';
  title: string;
  benefit: string;
  whoCanApply: string;
  documents: string[];
  howToApply: string;
};

export type SeedScheme = {
  code: string;
  slug: string;
  need: Need;
  districts: string[];
  rules: SeedRule[];
  lastCheckedAt: string;
  contents: SeedSchemeContent[];
};

export const HELP_CENTRES = DISTRICTS.map((district) => ({
  id: `help-centre-${district.toLowerCase()}`,
  district,
  name: `Company A Help Centre, ${district}`,
  address: `Placeholder address, ${district}`,
  phone: '000-0000000',
}));

export const CAMPAIGN = {
  slug: 'womens-health-camps',
  titleHi: 'महिला स्वास्थ्य शिविर',
  titleEn: "Women's health camps",
  descriptionHi: 'महिलाओं के लिए मुफ़्त स्वास्थ्य जाँच और जानकारी के शिविर।',
  descriptionEn: 'Free health check-ups and information camps for women.',
  isActive: true,
};

export const SEED_SCHEMES: SeedScheme[] = [
  {
    code: 'SCH-014',
    slug: 'state-widow-pension',
    need: 'PENSION',
    districts: [],
    lastCheckedAt: '2026-09-12',
    rules: [
      {
        fact: 'maritalStatus',
        op: 'eq',
        value: 'widow',
        labelHi: 'विधवा',
        labelEn: 'Widow',
      },
      {
        fact: 'age',
        op: 'between',
        value: [18, 79],
        labelHi: 'उम्र 18 से 79 वर्ष',
        labelEn: 'Aged 18 to 79',
      },
      {
        fact: 'hasBplCard',
        op: 'eq',
        value: 'yes',
        labelHi: 'BPL कार्ड है',
        labelEn: 'Has a BPL card',
      },
    ],
    contents: [
      {
        lang: 'hi',
        title: 'राज्य विधवा पेंशन',
        benefit: 'हर महीने ₹600 की पेंशन।',
        whoCanApply: '18 से 79 वर्ष की विधवा, जिसके पास BPL कार्ड है।',
        documents: [
          'पति का मृत्यु प्रमाण पत्र',
          'BPL कार्ड',
          'आधार कार्ड',
          'बैंक पासबुक (खाता संख्या और IFSC दिखे)',
          'पासपोर्ट साइज़ फोटो',
        ],
        howToApply:
          'अपनी ग्राम पंचायत या नज़दीकी सहायता केंद्र पर जाएँ। ऊपर लिखे कागज़ात साथ ले जाएँ। फ़ॉर्म भरकर जमा करें और रसीद संभालकर रखें।',
      },
      {
        lang: 'en',
        title: 'State widow pension',
        benefit: '₹600 pension every month.',
        whoCanApply: 'Widow aged 18 to 79 with a BPL card.',
        documents: [
          "Husband's death certificate",
          'BPL card',
          'Aadhaar card',
          'Bank passbook (showing account number and IFSC)',
          'Passport-size photo',
        ],
        howToApply:
          'Go to your gram panchayat or the nearest help centre. Bring the documents listed above. Fill in the form, submit it and keep the receipt.',
      },
    ],
  },
  {
    code: 'SCH-022',
    slug: 'shg-loan-support',
    need: 'LIVELIHOOD',
    districts: [],
    lastCheckedAt: '2026-08-30',
    rules: [
      {
        fact: 'isShgMember',
        op: 'eq',
        value: 'yes',
        labelHi: 'पंजीकृत स्वयं सहायता समूह की सदस्य',
        labelEn: 'Member of a registered SHG',
      },
    ],
    contents: [
      {
        lang: 'hi',
        title: 'स्वयं सहायता समूह ऋण सहायता',
        benefit: '₹3 लाख तक का ऋण, कम ब्याज पर।',
        whoCanApply: 'पंजीकृत स्वयं सहायता समूह (SHG) की सदस्य।',
        documents: [
          'SHG पंजीकरण प्रमाण',
          'समूह का बैंक खाता विवरण',
          'आधार कार्ड',
          'समूह की बैठक का रिकॉर्ड',
        ],
        howToApply:
          'अपने समूह के साथ नज़दीकी सहायता केंद्र या बैंक शाखा में आवेदन दें। समूह का प्रस्ताव और ऊपर लिखे कागज़ात साथ रखें।',
      },
      {
        lang: 'en',
        title: 'Self-help group loan support',
        benefit: 'Loans up to ₹3 lakh at low interest.',
        whoCanApply: 'Member of a registered self-help group (SHG).',
        documents: [
          'SHG registration proof',
          'Group bank account details',
          'Aadhaar card',
          'Group meeting records',
        ],
        howToApply:
          "Apply with your group at the nearest help centre or bank branch. Keep the group's proposal and the documents listed above with you.",
      },
    ],
  },
  {
    code: 'SCH-031',
    slug: 'maternity-cash-assistance',
    need: 'HEALTH',
    districts: [],
    lastCheckedAt: '2026-10-05',
    rules: [
      {
        fact: 'pregnancy',
        op: 'eq',
        value: 'first',
        labelHi: 'पहली बार गर्भवती (पहला बच्चा)',
        labelEn: 'Pregnant with her first child',
      },
    ],
    contents: [
      {
        lang: 'hi',
        title: 'मातृत्व नकद सहायता',
        benefit: 'किस्तों में ₹5,000।',
        whoCanApply: 'गर्भवती महिला, पहले बच्चे के लिए।',
        documents: ['गर्भावस्था पंजीकरण कार्ड', 'आधार कार्ड', 'बैंक पासबुक'],
        howToApply:
          'आँगनवाड़ी केंद्र या नज़दीकी स्वास्थ्य केंद्र पर गर्भावस्था का पंजीकरण कराएँ और फ़ॉर्म भरें।',
      },
      {
        lang: 'en',
        title: 'Maternity cash assistance',
        benefit: '₹5,000 in instalments.',
        whoCanApply: 'Pregnant woman, for her first child.',
        documents: ['Pregnancy registration card', 'Aadhaar card', 'Bank passbook'],
        howToApply:
          'Register the pregnancy at an anganwadi centre or the nearest health centre and fill in the form.',
      },
    ],
  },
];
