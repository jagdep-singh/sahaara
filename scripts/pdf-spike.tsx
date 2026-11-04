import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  renderToBuffer,
} from '@react-pdf/renderer';

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

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'NotoSans',
    fontSize: 14,
  },
  heading: {
    fontFamily: 'NotoSansDevanagari',
    fontWeight: 700,
    fontSize: 22,
    marginBottom: 20,
  },
  devanagari: {
    fontFamily: 'NotoSansDevanagari',
    fontSize: 18,
    lineHeight: 1.8,
    marginBottom: 12,
  },
  latin: {
    fontFamily: 'NotoSans',
    fontSize: 16,
    marginBottom: 12,
  },
});

const outPath = process.env.SPIKE_OUT ?? '/tmp/spike.pdf';

const document = (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.heading}>
        दान रसीद — सुनीता देवी
      </Text>
      <Text style={styles.devanagari}>
        क्षत्रिय, श्रद्धा, ज्ञान, द्वारा
      </Text>
      <Text style={styles.devanagari}>
        मात्राएँ: कि की कु कू के कै को कौ
      </Text>
      <Text style={styles.latin}>Receipt ₹5,000</Text>
      <Text style={styles.latin}>
        Conjuncts: क्ष त्र ज्ञ श्र द्व
      </Text>
    </Page>
  </Document>
);

const buffer = await renderToBuffer(document);

await writeFile(outPath, buffer);

console.log(`Wrote ${outPath} (${buffer.length} bytes)`);
