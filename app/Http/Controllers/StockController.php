<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class StockController extends Controller
{
    public function adjust(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'code' => 'required|string|exists:products,code',
            'action' => 'required|string|in:ADD,REDUCE,SET',
            'qty' => 'required|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Input penyesuaian tidak valid', 'errors' => $validator->errors()], 422);
        }

        $code = $request->input('code');
        $action = $request->input('action');
        $qty = intval($request->input('qty'));

        $product = Product::where('code', $code)->first();

        $currentStock = $product->stock;
        $finalStock = $currentStock;

        if ($action === 'ADD') {
            $finalStock = $currentStock + $qty;
        } elseif ($action === 'REDUCE') {
            if ($qty > $currentStock) {
                return response()->json(['message' => 'Jumlah pengurangan melebihi stok yang tersedia!'], 400);
            }
            $finalStock = $currentStock - $qty;
        } elseif ($action === 'SET') {
            $finalStock = $qty;
        }

        $product->update(['stock' => $finalStock]);

        return response()->json([
            'message' => 'Stok produk berhasil disesuaikan',
            'product' => $product
        ]);
    }
}
