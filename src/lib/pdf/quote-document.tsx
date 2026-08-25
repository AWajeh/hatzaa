import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import { pdfFontFamilyFor } from "./fonts";
import type { Locale } from "@prisma/client";

export interface QuotePdfData {
  locale: Locale;
  number: string;
  status: string;
  issueDate: string;
  validUntil: string | null;
  business: {
    name: string;
    ownerName: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    taxId: string | null;
    logoUrl: string | null;
  };
  customer: {
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
  };
  items: Array<{
    name: string;
    description: string | null;
    unit: string;
    quantity: string;
    unitPrice: string;
    lineTotal: string;
  }>;
  subtotal: string;
  discountLabel: string | null;
  discountTotal: string;
  vatRateLabel: string;
  vatTotal: string;
  total: string;
  terms: string | null;
  notes: string | null;
  labels: Record<string, string>;
}

const colors = {
  ink: "#1a1d24",
  muted: "#6b7280",
  border: "#e5e7eb",
  surface: "#f8f9fb",
  primary: "#2f5ce0",
};

function buildStyles(rtl: boolean, fontFamily: string) {
  const row = rtl ? "row-reverse" : "row";
  const start: "left" | "right" = rtl ? "right" : "left";
  const end: "left" | "right" = rtl ? "left" : "right";

  return StyleSheet.create({
    page: {
      fontFamily,
      fontSize: 9.5,
      color: colors.ink,
      paddingHorizontal: 40,
      paddingVertical: 36,
    },
    headerRow: {
      flexDirection: row,
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 24,
    },
    logo: { width: 44, height: 44, borderRadius: 6, objectFit: "cover" },
    businessName: { fontSize: 14, marginBottom: 2 },
    mutedLine: { fontSize: 8.5, color: colors.muted, marginBottom: 1 },
    quoteMeta: { alignItems: rtl ? "flex-start" : "flex-end" },
    quoteNumber: { fontSize: 16, color: colors.primary, marginBottom: 4 },
    statusBadge: {
      fontSize: 8,
      color: colors.primary,
      backgroundColor: "#eaf0fe",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      marginBottom: 4,
    },
    partiesRow: {
      flexDirection: row,
      justifyContent: "space-between",
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 14,
      marginBottom: 20,
    },
    partyBlock: { width: "48%" },
    partyLabel: { fontSize: 7.5, color: colors.muted, marginBottom: 4, textTransform: "uppercase" },
    partyName: { fontSize: 11, marginBottom: 2 },
    table: { marginBottom: 16 },
    tableHeaderRow: {
      flexDirection: row,
      borderBottomWidth: 1,
      borderBottomColor: colors.ink,
      paddingBottom: 6,
      marginBottom: 6,
    },
    tableRow: {
      flexDirection: row,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
      paddingVertical: 7,
    },
    th: { fontSize: 8, color: colors.muted, textTransform: "uppercase" },
    td: { fontSize: 9.5 },
    tdMuted: { fontSize: 8, color: colors.muted, marginTop: 2 },
    colName: { width: "40%", textAlign: start },
    colUnit: { width: "15%", textAlign: "center" },
    colQty: { width: "12%", textAlign: "center" },
    colPrice: { width: "16%", textAlign: end },
    colTotal: { width: "17%", textAlign: end },
    totalsWrap: { flexDirection: row, justifyContent: "flex-end", marginBottom: 20 },
    totalsBox: { width: "45%" },
    totalsLine: {
      flexDirection: row,
      justifyContent: "space-between",
      paddingVertical: 4,
    },
    totalsLabel: { fontSize: 9, color: colors.muted },
    totalsValue: { fontSize: 9 },
    grandTotalLine: {
      flexDirection: row,
      justifyContent: "space-between",
      borderTopWidth: 1,
      borderTopColor: colors.ink,
      marginTop: 6,
      paddingTop: 8,
    },
    grandTotalLabel: { fontSize: 11 },
    grandTotalValue: { fontSize: 13, color: colors.primary },
    section: { marginBottom: 14 },
    sectionLabel: { fontSize: 8.5, color: colors.muted, marginBottom: 4, textTransform: "uppercase" },
    sectionText: { fontSize: 9, lineHeight: 1.5 },
    footer: {
      position: "absolute",
      bottom: 28,
      left: 40,
      right: 40,
      textAlign: "center",
      fontSize: 7.5,
      color: colors.muted,
      borderTopWidth: 0.5,
      borderTopColor: colors.border,
      paddingTop: 10,
    },
  });
}

export function QuoteDocument({ data }: { data: QuotePdfData }) {
  const rtl = data.locale !== "en";
  const fontFamily = pdfFontFamilyFor(data.locale);
  const s = buildStyles(rtl, fontFamily);
  const l = data.labels;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.headerRow}>
          <View>
            {data.business.logoUrl ? (
              <Image src={data.business.logoUrl} style={s.logo} />
            ) : (
              <Text style={s.businessName}>{data.business.name}</Text>
            )}
            {data.business.logoUrl && <Text style={[s.businessName, { marginTop: 6 }]}>{data.business.name}</Text>}
            {data.business.address && <Text style={s.mutedLine}>{data.business.address}{data.business.city ? `, ${data.business.city}` : ""}</Text>}
            {data.business.phone && <Text style={s.mutedLine}>{data.business.phone}</Text>}
            {data.business.email && <Text style={s.mutedLine}>{data.business.email}</Text>}
            {data.business.taxId && <Text style={s.mutedLine}>{data.business.taxId}</Text>}
          </View>
          <View style={s.quoteMeta}>
            <Text style={s.quoteNumber}>{l.quoteNumber} {data.number}</Text>
            <Text style={s.statusBadge}>{data.status}</Text>
            <Text style={s.mutedLine}>{l.issueDate}: {data.issueDate}</Text>
            {data.validUntil && <Text style={s.mutedLine}>{l.validUntil}: {data.validUntil}</Text>}
          </View>
        </View>

        <View style={s.partiesRow}>
          <View style={s.partyBlock}>
            <Text style={s.partyLabel}>{l.preparedFor}</Text>
            <Text style={s.partyName}>{data.customer.name}</Text>
            {data.customer.phone && <Text style={s.mutedLine}>{data.customer.phone}</Text>}
            {data.customer.email && <Text style={s.mutedLine}>{data.customer.email}</Text>}
            {data.customer.address && <Text style={s.mutedLine}>{data.customer.address}</Text>}
          </View>
        </View>

        <View style={s.table}>
          <View style={s.tableHeaderRow}>
            <Text style={[s.th, s.colName]}>{l.service}</Text>
            <Text style={[s.th, s.colUnit]}>{l.unit ?? ""}</Text>
            <Text style={[s.th, s.colQty]}>{l.quantity}</Text>
            <Text style={[s.th, s.colPrice]}>{l.unitPrice}</Text>
            <Text style={[s.th, s.colTotal]}>{l.total}</Text>
          </View>
          {data.items.map((item, idx) => (
            <View style={s.tableRow} key={idx} wrap={false}>
              <View style={s.colName}>
                <Text style={s.td}>{item.name}</Text>
                {item.description && <Text style={s.tdMuted}>{item.description}</Text>}
              </View>
              <Text style={[s.td, s.colUnit]}>{item.unit}</Text>
              <Text style={[s.td, s.colQty]}>{item.quantity}</Text>
              <Text style={[s.td, s.colPrice]}>{item.unitPrice}</Text>
              <Text style={[s.td, s.colTotal]}>{item.lineTotal}</Text>
            </View>
          ))}
        </View>

        <View style={s.totalsWrap}>
          <View style={s.totalsBox}>
            <View style={s.totalsLine}>
              <Text style={s.totalsLabel}>{l.subtotal}</Text>
              <Text style={s.totalsValue}>{data.subtotal}</Text>
            </View>
            {data.discountLabel && (
              <View style={s.totalsLine}>
                <Text style={s.totalsLabel}>{l.discount} ({data.discountLabel})</Text>
                <Text style={s.totalsValue}>-{data.discountTotal}</Text>
              </View>
            )}
            <View style={s.totalsLine}>
              <Text style={s.totalsLabel}>{l.vat} ({data.vatRateLabel})</Text>
              <Text style={s.totalsValue}>{data.vatTotal}</Text>
            </View>
            <View style={s.grandTotalLine}>
              <Text style={s.grandTotalLabel}>{l.grandTotal}</Text>
              <Text style={s.grandTotalValue}>{data.total}</Text>
            </View>
          </View>
        </View>

        {data.terms && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>{l.terms}</Text>
            <Text style={s.sectionText}>{data.terms}</Text>
          </View>
        )}

        {data.notes && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>{l.notes}</Text>
            <Text style={s.sectionText}>{data.notes}</Text>
          </View>
        )}

        <Text style={s.footer} fixed>
          {l.poweredBy} Hatzaa · hatzaa.co.il
        </Text>
      </Page>
    </Document>
  );
}
