import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { format } from "date-fns";
import { id } from "date-fns/locale";

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 30,
  },
  header: {
    marginBottom: 20,
    textAlign: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 5,
  },
  period: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 3,
  },
  date: {
    fontSize: 10,
    color: "#666666",
    marginBottom: 20,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
    padding: 5,
    backgroundColor: "#f3f4f6",
  },
  summaryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  summaryCard: {
    width: "30%",
    margin: "0 1.5% 15px 1.5%",
    padding: 10,
    backgroundColor: "#f9fafb",
    borderRadius: 5,
  },
  summaryLabel: {
    fontSize: 10,
    color: "#666666",
    marginBottom: 3,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 3,
  },
  summarySubtext: {
    fontSize: 8,
    color: "#666666",
  },
  table: {
    display: "flex",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    borderBottomStyle: "solid",
    alignItems: "center",
    minHeight: 30,
  },
  tableRowHeader: {
    backgroundColor: "#f3f4f6",
  },
  tableCol: {
    padding: 5,
  },
  tableCell: {
    fontSize: 10,
  },
  tableCellHeader: {
    fontSize: 10,
    fontWeight: "bold",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 10,
    color: "#666666",
  },
  positive: {
    color: "#10b981",
  },
  negative: {
    color: "#ef4444",
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
    alignSelf: "center",
  },
  chartPlaceholder: {
    height: 200,
    backgroundColor: "#f9fafb",
    borderRadius: 5,
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  chartPlaceholderText: {
    fontSize: 12,
    color: "#666666",
  },
  pageNumber: {
    position: "absolute",
    bottom: 30,
    right: 30,
    fontSize: 10,
    color: "#666666",
  },
});

// Format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
};

// Calculate percentage change
const calculateChange = (current, previous) => {
  if (!previous || previous === 0) return { value: 0, isPositive: true };
  const change = ((current - previous) / previous) * 100;
  return {
    value: Math.abs(change).toFixed(1),
    isPositive: change >= 0,
  };
};

const ReportPDF = ({ reportData, reportType, dateRange, comparisonData }) => {
  if (!reportData) return null;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Sajiwa Steak Restaurant</Text>
          <Text style={styles.subtitle}>
            {reportType === "sales" && "Laporan Penjualan"}
            {reportType === "products" && "Laporan Produk"}
            {reportType === "categories" && "Laporan Kategori"}
          </Text>
          <Text style={styles.period}>
            Periode:{" "}
            {format(new Date(dateRange.start), "d MMMM yyyy", { locale: id })}{" "}
            hingga{" "}
            {format(new Date(dateRange.end), "d MMMM yyyy", { locale: id })}
          </Text>
          <Text style={styles.date}>
            Dibuat pada:{" "}
            {format(new Date(), "d MMMM yyyy HH:mm", { locale: id })}
          </Text>
        </View>

        {/* Summary Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ringkasan</Text>
          <View style={styles.summaryContainer}>
            {reportType === "sales" && (
              <>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Total Penjualan</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(reportData.summary.totalSales)}
                  </Text>
                  {comparisonData &&
                    (() => {
                      const change = calculateChange(
                        reportData.summary.totalSales,
                        comparisonData.summary.totalSales
                      );
                      return (
                        <Text
                          style={[
                            styles.summarySubtext,
                            change.isPositive
                              ? styles.positive
                              : styles.negative,
                          ]}
                        >
                          {change.isPositive ? "↑" : "↓"} {change.value}% vs
                          periode sebelumnya
                        </Text>
                      );
                    })()}
                </View>

                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Total Pesanan</Text>
                  <Text style={styles.summaryValue}>
                    {reportData.summary.totalOrders}
                  </Text>
                  {comparisonData &&
                    (() => {
                      const change = calculateChange(
                        reportData.summary.totalOrders,
                        comparisonData.summary.totalOrders
                      );
                      return (
                        <Text
                          style={[
                            styles.summarySubtext,
                            change.isPositive
                              ? styles.positive
                              : styles.negative,
                          ]}
                        >
                          {change.isPositive ? "↑" : "↓"} {change.value}% vs
                          periode sebelumnya
                        </Text>
                      );
                    })()}
                </View>

                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>
                    Rata-rata Nilai Pesanan
                  </Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(reportData.summary.averageSale)}
                  </Text>
                  <Text style={styles.summarySubtext}>Per transaksi</Text>
                </View>

                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>
                    Rata-rata Penjualan Harian
                  </Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(reportData.summary.dailyAverage)}
                  </Text>
                  <Text style={styles.summarySubtext}>
                    Selama {reportData.summary.periodLength} hari
                  </Text>
                </View>

                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Pertumbuhan</Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      reportData.summary.growthRate >= 0
                        ? styles.positive
                        : styles.negative,
                    ]}
                  >
                    {reportData.summary.growthRate >= 0 ? "+" : ""}
                    {reportData.summary.growthRate}%
                  </Text>
                  <Text style={styles.summarySubtext}>
                    Dibandingkan paruh pertama periode
                  </Text>
                </View>

                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>
                    Rata-rata Pesanan per Hari
                  </Text>
                  <Text style={styles.summaryValue}>
                    {(
                      reportData.summary.totalOrders /
                      reportData.summary.periodLength
                    ).toFixed(1)}
                  </Text>
                  <Text style={styles.summarySubtext}>Transaksi per hari</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Chart Placeholder */}
        <View style={styles.chartPlaceholder}>
          <Text style={styles.chartPlaceholderText}>
            Grafik tidak tersedia dalam format PDF. Silakan lihat di aplikasi
            web.
          </Text>
        </View>

        {/* Detailed Data Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Detail</Text>

          {reportType === "sales" && (
            <View style={styles.table}>
              {/* Table Header */}
              <View style={[styles.tableRow, styles.tableRowHeader]}>
                <View style={[styles.tableCol, { width: "25%" }]}>
                  <Text style={styles.tableCellHeader}>Tanggal</Text>
                </View>
                <View style={[styles.tableCol, { width: "25%" }]}>
                  <Text style={styles.tableCellHeader}>Penjualan</Text>
                </View>
                <View style={[styles.tableCol, { width: "25%" }]}>
                  <Text style={styles.tableCellHeader}>Pesanan</Text>
                </View>
                <View style={[styles.tableCol, { width: "25%" }]}>
                  <Text style={styles.tableCellHeader}>Rata-rata</Text>
                </View>
              </View>

              {/* Table Rows - limit to 15 rows for first page */}
              {reportData.salesData.slice(0, 15).map((item, index) => (
                <View key={index} style={styles.tableRow}>
                  <View style={[styles.tableCol, { width: "25%" }]}>
                    <Text style={styles.tableCell}>{item.date}</Text>
                  </View>
                  <View style={[styles.tableCol, { width: "25%" }]}>
                    <Text style={styles.tableCell}>
                      {formatCurrency(item.sales)}
                    </Text>
                  </View>
                  <View style={[styles.tableCol, { width: "25%" }]}>
                    <Text style={styles.tableCell}>{item.orders}</Text>
                  </View>
                  <View style={[styles.tableCol, { width: "25%" }]}>
                    <Text style={styles.tableCell}>
                      {formatCurrency(
                        item.orders > 0 ? item.sales / item.orders : 0
                      )}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {reportType === "products" && (
            <View style={styles.table}>
              {/* Table Header */}
              <View style={[styles.tableRow, styles.tableRowHeader]}>
                <View style={[styles.tableCol, { width: "40%" }]}>
                  <Text style={styles.tableCellHeader}>Produk</Text>
                </View>
                <View style={[styles.tableCol, { width: "20%" }]}>
                  <Text style={styles.tableCellHeader}>Jumlah</Text>
                </View>
                <View style={[styles.tableCol, { width: "20%" }]}>
                  <Text style={styles.tableCellHeader}>Pendapatan</Text>
                </View>
                <View style={[styles.tableCol, { width: "20%" }]}>
                  <Text style={styles.tableCellHeader}>% dari Total</Text>
                </View>
              </View>

              {/* Table Rows */}
              {reportData.topProducts.map((item, index) => {
                const totalQuantity = reportData.topProducts.reduce(
                  (sum, i) => sum + i.quantity,
                  0
                );
                const percentage = (
                  (item.quantity / totalQuantity) *
                  100
                ).toFixed(1);

                return (
                  <View key={index} style={styles.tableRow}>
                    <View style={[styles.tableCol, { width: "40%" }]}>
                      <Text style={styles.tableCell}>{item.name}</Text>
                    </View>
                    <View style={[styles.tableCol, { width: "20%" }]}>
                      <Text style={styles.tableCell}>{item.quantity}</Text>
                    </View>
                    <View style={[styles.tableCol, { width: "20%" }]}>
                      <Text style={styles.tableCell}>
                        {formatCurrency(item.revenue)}
                      </Text>
                    </View>
                    <View style={[styles.tableCol, { width: "20%" }]}>
                      <Text style={styles.tableCell}>{percentage}%</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {reportType === "categories" && (
            <View style={styles.table}>
              {/* Table Header */}
              <View style={[styles.tableRow, styles.tableRowHeader]}>
                <View style={[styles.tableCol, { width: "40%" }]}>
                  <Text style={styles.tableCellHeader}>Kategori</Text>
                </View>
                <View style={[styles.tableCol, { width: "20%" }]}>
                  <Text style={styles.tableCellHeader}>Jumlah</Text>
                </View>
                <View style={[styles.tableCol, { width: "20%" }]}>
                  <Text style={styles.tableCellHeader}>Pendapatan</Text>
                </View>
                <View style={[styles.tableCol, { width: "20%" }]}>
                  <Text style={styles.tableCellHeader}>% dari Total</Text>
                </View>
              </View>

              {/* Table Rows */}
              {reportData.categoryData.map((item, index) => {
                const totalQuantity = reportData.categoryData.reduce(
                  (sum, i) => sum + i.quantity,
                  0
                );
                const percentage = (
                  (item.quantity / totalQuantity) *
                  100
                ).toFixed(1);

                return (
                  <View key={index} style={styles.tableRow}>
                    <View style={[styles.tableCol, { width: "40%" }]}>
                      <Text style={styles.tableCell}>{item.name}</Text>
                    </View>
                    <View style={[styles.tableCol, { width: "20%" }]}>
                      <Text style={styles.tableCell}>{item.quantity}</Text>
                    </View>
                    <View style={[styles.tableCol, { width: "20%" }]}>
                      <Text style={styles.tableCell}>
                        {formatCurrency(item.revenue)}
                      </Text>
                    </View>
                    <View style={[styles.tableCol, { width: "20%" }]}>
                      <Text style={styles.tableCell}>{percentage}%</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Sajiwa Steak Restaurant - {format(new Date(), "yyyy")}</Text>
          <Text>Laporan ini dibuat secara otomatis oleh sistem</Text>
        </View>

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>

      {/* Additional pages for sales data if needed */}
      {reportType === "sales" && reportData.salesData.length > 15 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.title}>Sajiwa Steak Restaurant</Text>
            <Text style={styles.subtitle}>Laporan Penjualan - Lanjutan</Text>
            <Text style={styles.period}>
              Periode:{" "}
              {format(new Date(dateRange.start), "d MMMM yyyy", { locale: id })}{" "}
              hingga{" "}
              {format(new Date(dateRange.end), "d MMMM yyyy", { locale: id })}
            </Text>
            <Text style={styles.date}>
              Dibuat pada:{" "}
              {format(new Date(), "d MMMM yyyy HH:mm", { locale: id })}
            </Text>
          </View>

          {/* Continued Sales Data Table */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Detail (Lanjutan)</Text>

            <View style={styles.table}>
              {/* Table Header */}
              <View style={[styles.tableRow, styles.tableRowHeader]}>
                <View style={[styles.tableCol, { width: "25%" }]}>
                  <Text style={styles.tableCellHeader}>Tanggal</Text>
                </View>
                <View style={[styles.tableCol, { width: "25%" }]}>
                  <Text style={styles.tableCellHeader}>Penjualan</Text>
                </View>
                <View style={[styles.tableCol, { width: "25%" }]}>
                  <Text style={styles.tableCellHeader}>Pesanan</Text>
                </View>
                <View style={[styles.tableCol, { width: "25%" }]}>
                  <Text style={styles.tableCellHeader}>Rata-rata</Text>
                </View>
              </View>

              {/* Table Rows - remaining rows */}
              {reportData.salesData.slice(15).map((item, index) => (
                <View key={index + 15} style={styles.tableRow}>
                  <View style={[styles.tableCol, { width: "25%" }]}>
                    <Text style={styles.tableCell}>{item.date}</Text>
                  </View>
                  <View style={[styles.tableCol, { width: "25%" }]}>
                    <Text style={styles.tableCell}>
                      {formatCurrency(item.sales)}
                    </Text>
                  </View>
                  <View style={[styles.tableCol, { width: "25%" }]}>
                    <Text style={styles.tableCell}>{item.orders}</Text>
                  </View>
                  <View style={[styles.tableCol, { width: "25%" }]}>
                    <Text style={styles.tableCell}>
                      {formatCurrency(
                        item.orders > 0 ? item.sales / item.orders : 0
                      )}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text>Sajiwa Steak Restaurant - {format(new Date(), "yyyy")}</Text>
            <Text>Laporan ini dibuat secara otomatis oleh sistem</Text>
          </View>

          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) =>
              `${pageNumber} / ${totalPages}`
            }
            fixed
          />
        </Page>
      )}
    </Document>
  );
};

export default ReportPDF;
