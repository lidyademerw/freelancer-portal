import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import { Invoice, Project, Task, Profile } from '../types/portal';

// Stylesheet for @react-pdf/renderer (only uses standard layout rules)
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 40,
    color: '#1e293b', // slate-800
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1.5,
    borderBottomColor: '#f1f5f9', // slate-100
    paddingBottom: 20,
    marginBottom: 25,
  },
  logoContainer: {
    flexDirection: 'column',
  },
  logo: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#6366f1', // brand indigo
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 9,
    color: '#64748b', // slate-500
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaContainer: {
    textAlign: 'right',
  },
  invoiceTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a', // slate-900
    marginBottom: 4,
  },
  metaText: {
    fontSize: 8.5,
    color: '#64748b',
    marginTop: 2,
  },
  billSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  billCol: {
    width: '45%',
  },
  sectionTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#94a3b8', // slate-400
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 4,
  },
  partyName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  partyDetails: {
    fontSize: 8.5,
    color: '#475569', // slate-600
    marginTop: 3,
    lineHeight: 1.4,
  },
  table: {
    marginTop: 10,
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc', // slate-50
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    padding: 8,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8.5,
    color: '#475569',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    padding: 8,
    alignItems: 'center',
  },
  colDesc: {
    flex: 3,
  },
  colPriority: {
    flex: 1,
    textAlign: 'center',
  },
  colStatus: {
    flex: 1,
    textAlign: 'right',
  },
  rowText: {
    fontSize: 9,
    color: '#334155',
  },
  rowTextBold: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  badgeLow: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    textAlign: 'center',
  },
  badgeMedium: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#b45309',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    textAlign: 'center',
  },
  badgeHigh: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#be123c',
    backgroundColor: '#fff1f2',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    textAlign: 'center',
  },
  summarySection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
  },
  summaryBox: {
    width: '40%',
    borderTopWidth: 1.5,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 9,
    color: '#64748b',
  },
  summaryValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  totalLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#6366f1',
  },
  totalValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#6366f1',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 7.5,
    color: '#94a3b8',
    lineHeight: 1.3,
  },
});

interface InvoicePDFProps {
  invoice: Invoice;
  project: Project | undefined;
  tasks: Task[];
  client: Profile;
}

export const InvoicePDFDocument: React.FC<InvoicePDFProps> = ({
  invoice,
  project,
  tasks,
  client,
}) => {
  const invoiceTasks = tasks.filter(t => t.project_id === invoice.project_id);
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(invoice.amount);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Block */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>AR studio.</Text>
            <Text style={styles.subtitle}>Alex Rivers — Creative Engineer</Text>
          </View>
          <View style={styles.metaContainer}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.metaText}>Invoice No: {invoice.invoice_number}</Text>
            <Text style={styles.metaText}>Date: {new Date().toISOString().split('T')[0]}</Text>
            <Text style={styles.metaText}>Due Date: {invoice.due_date}</Text>
          </View>
        </View>

        {/* Bill Section */}
        <View style={styles.billSection}>
          <View style={styles.billCol}>
            <Text style={styles.sectionTitle}>From (Freelancer)</Text>
            <Text style={styles.partyName}>Alex Rivers</Text>
            <Text style={styles.partyDetails}>
              AR studio. LLC{"\n"}
              hello@alexrivers.studio{"\n"}
              https://alexrivers.studio
            </Text>
          </View>
          <View style={styles.billCol}>
            <Text style={styles.sectionTitle}>Bill To (Client)</Text>
            <Text style={styles.partyName}>{client.company_name || 'Client Representative'}</Text>
            <Text style={styles.partyDetails}>
              Attn: {client.full_name}{"\n"}
              Secure B2B Portal Verified{"\n"}
              Client ID: {client.id}
            </Text>
          </View>
        </View>

        {/* Project Context */}
        <View style={{ marginBottom: 15 }}>
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#64748b', textTransform: 'uppercase' }}>
            Project Reference:
          </Text>
          <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#0f172a', marginTop: 2 }}>
            {project?.title || 'Deliverable Pipeline'}
          </Text>
        </View>

        {/* Itemized Tasks Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDesc}>Project Task Scope Item</Text>
            <Text style={styles.colPriority}>Priority</Text>
            <Text style={styles.colStatus}>Status</Text>
          </View>

          {invoiceTasks.length === 0 ? (
            <View style={styles.tableRow}>
              <Text style={[styles.rowText, { fontStyle: 'italic', color: '#94a3b8' }]}>
                No specific task items itemized. Comprehensive project sign-off deliverable.
              </Text>
            </View>
          ) : (
            invoiceTasks.map((task) => (
              <View key={task.id} style={styles.tableRow}>
                <View style={styles.colDesc}>
                  <Text style={styles.rowTextBold}>{task.title}</Text>
                  {task.description && (
                    <Text style={{ fontSize: 7.5, color: '#64748b', marginTop: 2 }}>
                      {task.description}
                    </Text>
                  )}
                </View>
                <View style={styles.colPriority}>
                  <Text style={
                    task.priority === 'high' ? styles.badgeHigh :
                    task.priority === 'medium' ? styles.badgeMedium :
                    styles.badgeLow
                  }>
                    {task.priority || 'medium'}
                  </Text>
                </View>
                <View style={styles.colStatus}>
                  <Text style={[styles.rowText, { textTransform: 'uppercase', fontSize: 8, fontFamily: 'Helvetica-Bold', color: task.status === 'done' ? '#10b981' : '#64748b' }]}>
                    {task.status.replace('_', ' ')}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Summary box */}
        <View style={styles.summarySection}>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formattedAmount}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>VAT / Taxes (0%)</Text>
              <Text style={styles.summaryValue}>$0.00</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Due</Text>
              <Text style={styles.totalValue}>{formattedAmount}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Thank you for your partnership! This invoice is secure and cryptographically recorded.{"\n"}
            Payments can be settled through standard banking routes outlined in your master client agreement.
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export const InvoiceDownloadButton: React.FC<{
  invoice: Invoice;
  project: Project | undefined;
  tasks: Task[];
  client: Profile;
  brandColor?: string;
}> = ({ invoice, project, tasks, client, brandColor = '#6366f1' }) => {
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <span className="inline-flex items-center justify-center px-4 py-2.5 bg-slate-100 text-slate-400 text-xs font-semibold rounded-xl cursor-not-allowed">
        Preparing Document...
      </span>
    );
  }

  return (
    <PDFDownloadLink
      document={
        <InvoicePDFDocument
          invoice={invoice}
          project={project}
          tasks={tasks}
          client={client}
        />
      }
      fileName={`Invoice_${invoice.invoice_number}.pdf`}
      style={{ textDecoration: 'none' }}
    >
      {({ blob, url, loading, error }) => (
        <span
          className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white shadow-3xs transition-all hover:opacity-95 active:scale-98 cursor-pointer`}
          style={{ backgroundColor: brandColor }}
        >
          {loading ? (
            <>
              <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
              Compiling...
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Generate PDF
            </>
          )}
        </span>
      )}
    </PDFDownloadLink>
  );
};

