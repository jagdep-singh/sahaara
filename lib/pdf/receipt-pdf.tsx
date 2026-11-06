import path from 'node:path';

import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from '@react-pdf/renderer';

import { rupeesInWords } from '@/lib/money';

const fontDir = path.join(process.cwd(), 'assets/fonts');

Font.register({
  family: 'NotoSans',
  fonts: [
    {
      src: path.join(fontDir, 'NotoSans-Regular.ttf'),
      fontWeight: 400,
    },
    {
      src: path.join(fontDir, 'NotoSans-Bold.ttf'),
      fontWeight: 700,
    },
  ],
});

Font.register({
  family: 'NotoSansDevanagari',
  fonts: [
    {
      src: path.join(fontDir, 'NotoSansDevanagari-Regular.ttf'),
      fontWeight: 400,
    },
    {
      src: path.join(fontDir, 'NotoSansDevanagari-Bold.ttf'),
      fontWeight: 700,
    },
  ],
});

Font.registerHyphenationCallback((word) => [word]);

export type ReceiptPdfInput = {
  number: string;
  issuedAt: Date;
  donorName: string;
  donorPan: string;
  amountPaise: number;
  campaignTitle: string | null;
};

export type ReceiptPdfFields = {
  trustName: string;
  trustAddress: string;
  trustPan: string;
  trust80g: string;
  receiptNumber: string;
  date: string;
  donorName: string;
  donorPan: string;
  amount: string;
  amountInWords: string;
  towards: string;
};

type TrustDetails = {
  name: string;
  address: string;
  pan: string;
  reg80g: string;
};

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} must be set`);
  return value;
}

export function getTrustDetails(): TrustDetails {
  return {
    name: requiredEnv('TRUST_NAME'),
    address: requiredEnv('TRUST_ADDRESS'),
    pan: requiredEnv('TRUST_PAN'),
    reg80g: requiredEnv('TRUST_80G_REG'),
  };
}

export function formatReceiptDateIST(date: Date) {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
}

function formatPdfAmount(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function amountInWords(paise: number) {
  const rupees = Math.floor(paise / 100);
  const paisePart = paise % 100;
  const words = rupeesInWords(rupees);

  if (paisePart === 0) return words;

  const paiseWords = rupeesInWords(paisePart).replace(
    ' Rupees Only',
    ''
  );
  return `${words.replace(' Only', '')} and ${paiseWords} Paise Only`;
}

export function getReceiptPdfFields(
  receipt: ReceiptPdfInput
): ReceiptPdfFields {
  const trust = getTrustDetails();

  return {
    trustName: trust.name,
    trustAddress: trust.address,
    trustPan: trust.pan,
    trust80g: trust.reg80g,
    receiptNumber: receipt.number,
    date: formatReceiptDateIST(receipt.issuedAt),
    donorName: receipt.donorName,
    donorPan: receipt.donorPan,
    amount: formatPdfAmount(receipt.amountPaise),
    amountInWords: amountInWords(receipt.amountPaise),
    towards: receipt.campaignTitle ?? 'General fund',
  };
}

const COLORS = {
  ink: '#1f2937',
  muted: '#6b7280',
  accent: '#1e3a5f',
  line: '#d1d5db',
  tint: '#f5f7fa',
  warning: '#b91c1c',
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 44,
    paddingBottom: 80,
    paddingHorizontal: 48,
    fontFamily: 'NotoSans',
    fontSize: 10,
    lineHeight: 1.5,
    color: COLORS.ink,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: COLORS.accent,
  },

  // Letterhead
  trustName: {
    fontWeight: 700,
    fontSize: 18,
    color: COLORS.accent,
    textAlign: 'center',
    marginBottom: 4,
  },
  muted: {
    color: COLORS.muted,
    fontSize: 9,
    textAlign: 'center',
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    marginVertical: 16,
  },

  // Title
  title: {
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: 1.5,
    textAlign: 'center',
    color: COLORS.accent,
    marginBottom: 18,
  },

  // Layout helpers
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  column: {
    width: '48%',
  },

  // Field label + value
  label: {
    fontWeight: 700,
    fontSize: 7.5,
    letterSpacing: 1,
    color: COLORS.muted,
    marginBottom: 3,
  },
  value: {
    fontSize: 11.5,
  },
  amount: {
    fontWeight: 700,
    fontSize: 14,
    color: COLORS.accent,
  },
  devanagari: {
    fontFamily: 'NotoSansDevanagari',
  },

  // Main details card
  box: {
    backgroundColor: COLORS.tint,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
    borderRadius: 3,
    padding: 16,
    marginTop: 6,
  },

  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontWeight: 700,
    fontSize: 8,
    letterSpacing: 1,
    color: COLORS.muted,
    marginBottom: 4,
    textTransform: 'uppercase',
  },

  // Signature: right-aligned with a line above
  signature: {
    marginTop: 48,
    alignSelf: 'flex-end',
    width: 170,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.ink,
    textAlign: 'center',
    fontSize: 9,
    color: COLORS.muted,
  },

  // Fixed footer on every page
  footer: {
    position: 'absolute',
    left: 48,
    right: 48,
    bottom: 34,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    paddingTop: 8,
    fontFamily: 'NotoSans',
    fontSize: 8,
    letterSpacing: 0.5,
    color: COLORS.warning,
    textAlign: 'center',
  },
});

export function ReceiptDocument({
  receipt,
}: {
  receipt: ReceiptPdfInput;
}) {
  const fields = getReceiptPdfFields(receipt);
  const hasDevanagari = /[\u0900-\u097F]/.test(fields.donorName);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.topBar} fixed />

        <View>
          <Text style={styles.trustName}>{fields.trustName}</Text>
          <Text style={styles.muted}>{fields.trustAddress}</Text>
          <Text style={styles.muted}>
            PAN: {fields.trustPan} | 80G Registration No.:{' '}
            {fields.trust80g}
          </Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.title}>
          DONATION RECEIPT AND 80G CERTIFICATE
        </Text>

        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>RECEIPT NO.</Text>
            <Text style={styles.value}>{fields.receiptNumber}</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>DATE</Text>
            <Text style={styles.value}>{fields.date}</Text>
          </View>
        </View>

        <View style={styles.box}>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>RECEIVED WITH THANKS FROM</Text>
              <Text
                style={[
                  styles.value,
                  hasDevanagari ? styles.devanagari : {},
                ]}
              >
                {fields.donorName}
              </Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>DONOR PAN</Text>
              <Text style={styles.value}>{fields.donorPan}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>AMOUNT</Text>
              <Text style={[styles.value, styles.amount]}>
                {fields.amount}
              </Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>MODE OF PAYMENT</Text>
              <Text style={styles.value}>Online (test mode)</Text>
            </View>
          </View>

          <View>
            <Text style={styles.label}>AMOUNT IN WORDS</Text>
            <Text style={styles.value}>{fields.amountInWords}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>TOWARDS</Text>
          <Text style={styles.value}>{fields.towards}</Text>
        </View>

        <View style={styles.section}>
          <Text>
            This donation qualifies for deduction under Section 80G of the
            Income-tax Act, 1961, subject to the limits and conditions in
            the Act. (Sample wording, to be confirmed by the trust&apos;s
            accountant.)
          </Text>
        </View>

        <Text style={styles.signature}>
          Authorised signatory (placeholder)
        </Text>

        <Text style={styles.footer} fixed>
          sample document. Not a valid certificate.
        </Text>
      </Page>
    </Document>
  );
}

export function renderReceiptPdf(receipt: ReceiptPdfInput) {
  return renderToBuffer(<ReceiptDocument receipt={receipt} />);
}