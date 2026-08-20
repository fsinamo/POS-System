import { Transaction, Product, StoreSettings } from '../types';

export const formatRupiah = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null || isNaN(amount)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('id-ID').format(num);
};

export const formatDate = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
};

export const formatDateTime = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateStr;
  }
};

export const formatTime = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateStr;
  }
};

export const generateInvoiceNumber = (): string => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `TRX-${dateStr}-${randomSuffix}`;
};

export const generateBarcode = (): string => {
  const prefix = '899'; // Indonesian prefix standard
  const random = Math.floor(100000000 + Math.random() * 900000000).toString();
  return `${prefix}${random.slice(0, 10)}`;
};

export const exportToCSV = (filename: string, rows: (string | number)[][]) => {
  const processRow = (row: (string | number)[]) => {
    return row
      .map((val) => {
        const stringVal = val === null || val === undefined ? '' : String(val);
        const result = stringVal.replace(/"/g, '""');
        if (result.search(/("|,|\n)/g) >= 0) return `"${result}"`;
        return result;
      })
      .join(',');
  };

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map(processRow).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const syncToGoogleSheets = async (
  webhookUrl: string,
  transaction: Transaction,
  settings: StoreSettings
): Promise<{ success: boolean; message: string }> => {
  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    return { success: false, message: 'URL Google Apps Script belum dikonfigurasi.' };
  }

  try {
    const payload = {
      action: 'ADD_TRANSACTION',
      timestamp: new Date().toISOString(),
      storeName: settings.storeName,
      invoice: transaction.id,
      date: transaction.createdAt,
      cashier: transaction.cashierName,
      customer: transaction.customerName || '-',
      itemsSummary: transaction.items.map((i) => `${i.productName} (${i.quantity}x)`).join('; '),
      totalItems: transaction.items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: transaction.subtotal,
      discount: transaction.discountAmount,
      tax: transaction.taxAmount,
      totalAmount: transaction.totalAmount,
      totalHPP: transaction.totalCost,
      grossProfit: transaction.grossProfit,
      paymentMethod: transaction.paymentMethod,
      status: transaction.status,
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors', // Apps script redirects require no-cors or JSONP
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return {
      success: true,
      message: 'Transaksi berhasil disinkronisasi ke Google Sheets!',
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Gagal sinkronisasi data',
    };
  }
};
