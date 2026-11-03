<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Transaction;
use App\Models\TransactionItem;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class TransactionController extends Controller
{
    public function checkout(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'cashier' => 'required|string',
            'subtotal' => 'required|integer',
            'tax' => 'required|integer',
            'total' => 'required|integer',
            'items' => 'required|array|min:1',
            'items.*.code' => 'required|string|exists:products,code',
            'items.*.qty' => 'required|integer|min:1',
            'items.*.price' => 'required|integer|min:0',
            'items.*.name' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Input transaksi tidak valid', 'errors' => $validator->errors()], 422);
        }

        $cashier = $request->input('cashier');
        $subtotal = intval($request->input('subtotal'));
        $tax = intval($request->input('tax'));
        $total = intval($request->input('total'));
        $items = $request->input('items');

        try {
            $result = DB::transaction(function () use ($cashier, $subtotal, $tax, $total, $items) {
                // Generate Invoice Number ID: TRX-YYYYMMDD-XXXX
                $d = Carbon::now('Asia/Jakarta');
                $dateStr = $d->format('Ymd');
                $randomTrx = strval(rand(1000, 9999));
                $trxId = "TRX-{$dateStr}-{$randomTrx}";

                // 1. Create Transaction
                $transaction = Transaction::create([
                    'id' => $trxId,
                    'date' => $d->format('Y-m-d'),
                    'time' => $d->format('H:i:s'),
                    'cashier' => $cashier,
                    'subtotal' => $subtotal,
                    'tax' => $tax,
                    'total' => $total,
                ]);

                // 2. Process Items and Reduce Stocks
                foreach ($items as $item) {
                    // Reduce Stock
                    $product = Product::where('code', $item['code'])->lockForUpdate()->first();
                    if ($product) {
                        $newStock = max(0, $product->stock - intval($item['qty']));
                        $product->update(['stock' => $newStock]);
                    }

                    // Create Item log
                    TransactionItem::create([
                        'transaction_id' => $trxId,
                        'name' => $item['name'],
                        'qty' => intval($item['qty']),
                        'price' => intval($item['price']),
                    ]);
                }

                return $transaction->load('items');
            });

            return response()->json([
                'message' => 'Checkout transaksi berhasil',
                'transaction' => $result
            ], 210);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Terjadi kesalahan sistem saat checkout',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function index(Request $request)
    {
        $query = Transaction::with('items')->orderBy('created_at', 'desc');

        // Optional search query (ID or Cashier)
        if ($request->has('search') && $request->input('search') !== '') {
            $search = strtolower($request->input('search'));
            $query->where(function($q) use ($search) {
                $q->whereRaw('lower(id) like ?', ["%{$search}%"])
                  ->orWhereRaw('lower(cashier) like ?', ["%{$search}%"]);
            });
        }

        // Optional date range filters
        if ($request->has('startDate') && $request->input('startDate') !== '') {
            $query->where('date', '>=', $request->input('startDate'));
        }
        if ($request->has('endDate') && $request->input('endDate') !== '') {
            $query->where('date', '<=', $request->input('endDate'));
        }

        return response()->json($query->get());
    }

    public function analytics(Request $request)
    {
        $period = $request->input('period', 'ALL');
        $query = Transaction::with('items');

        // Period threshold setup
        $now = Carbon::now()->startOfDay();
        if ($period === 'TODAY') {
            $query->where('date', $now->format('Y-m-d'));
        } elseif ($period === 'LAST_7_DAYS') {
            $query->where('date', '>=', $now->subDays(7)->format('Y-m-d'));
        } elseif ($period === 'LAST_30_DAYS') {
            $query->where('date', '>=', $now->subDays(30)->format('Y-m-d'));
        }

        $transactions = $query->get();

        // 1. Calculate overall financial summary statistics
        $trxCount = $transactions->count();
        $revenueSum = 0; // Net Subtotal
        $taxSum = 0;
        $unitsCount = 0;
        $productSalesMap = [];
        $dailyRevenueMap = [];

        foreach ($transactions as $t) {
            $revenueSum += $t->subtotal;
            $taxSum += $t->tax;
            
            // Group by date
            if (!isset($dailyRevenueMap[$t->date])) {
                $dailyRevenueMap[$t->date] = 0;
            }
            $dailyRevenueMap[$t->date] += $t->subtotal;

            foreach ($t->items as $item) {
                $unitsCount += $item->qty;
                
                if (!isset($productSalesMap[$item->name])) {
                    $productSalesMap[$item->name] = ['qty' => 0, 'val' => 0];
                }
                $productSalesMap[$item->name]['qty'] += $item->qty;
                $productSalesMap[$item->name]['val'] += ($item->qty * $item->price);
            }
        }

        $avgCart = $trxCount > 0 ? round(($revenueSum + $taxSum) / $trxCount) : 0;

        // 2. Format best sellers (sorted top-5)
        $topProducts = [];
        foreach ($productSalesMap as $name => $data) {
            $topProducts[] = [
                'name' => $name,
                'qty' => $data['qty'],
                'val' => $data['val'],
            ];
        }
        usort($topProducts, function($a, $b) {
            return $b['qty'] - $a['qty'];
        });
        $topProducts = array_slice($topProducts, 0, 5);

        // 3. Format daily revenue line chart series
        ksort($dailyRevenueMap);
        $chartData = [];
        foreach ($dailyRevenueMap as $date => $val) {
            $chartData[] = [
                'date' => $pt = Carbon::parse($date)->format('Y-m-d'),
                'val' => $val
            ];
        }

        return response()->json([
            'summary' => [
                'revenue' => $revenueSum,
                'tax' => $taxSum,
                'total' => $revenueSum + $taxSum,
                'trxCount' => $trxCount,
                'unitsCount' => $unitsCount,
                'avgCart' => $avgCart
            ],
            'chartData' => $chartData,
            'topProducts' => $topProducts
        ]);
    }

    public function destroy($id)
    {
        $transaction = Transaction::find($id);
        if (!$transaction) {
            return response()->json(['message' => 'Transaksi tidak ditemukan'], 404);
        }

        DB::transaction(function () use ($transaction) {
            TransactionItem::where('transaction_id', $transaction->id)->delete();
            $transaction->delete();
        });

        return response()->json(['message' => 'Transaksi berhasil dihapus']);
    }

    public function clearAll()
    {
        DB::transaction(function () {
            TransactionItem::query()->delete();
            Transaction::query()->delete();
        });

        return response()->json(['message' => 'Seluruh riwayat transaksi berhasil dihapus']);
    }
}
