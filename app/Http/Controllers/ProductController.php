<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::query();

        // Optional filter by category name
        if ($request->has('category') && $request->input('category') !== 'ALL') {
            $query->where('category', $request->input('category'));
        }

        // Optional search query
        if ($request->has('search') && $request->input('search') !== '') {
            $search = strtolower($request->input('search'));
            $query->where(function($q) use ($search) {
                $q->whereRaw('lower(name) like ?', ["%{$search}%"])
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        $products = $query->get();
        $categories = Category::all()->keyBy('id');

        foreach ($products as $p) {
            if (empty($p->category) || $p->category === '-') {
                if ($p->category_id && isset($categories[$p->category_id])) {
                    $p->category = $categories[$p->category_id]->name;
                }
            }
        }

        return response()->json($products);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'code' => 'required|string|unique:products,code',
            'name' => 'required|string|min:2',
            'category' => 'nullable|string',
            'category_id' => 'nullable',
            'price' => 'required|numeric|min:0',
            'stock' => 'required|numeric|min:0',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Input produk tidak valid', 'errors' => $validator->errors()], 422);
        }

        $data = $request->all();

        // Resolve category name if missing
        if (empty($data['category'])) {
            if (!empty($data['category_id'])) {
                $cat = Category::find($data['category_id']);
                $data['category'] = $cat ? $cat->name : '-';
            } else {
                $data['category'] = '-';
            }
        }

        if (!isset($data['description'])) {
            $data['description'] = '';
        }

        $product = Product::create($data);

        return response()->json(['message' => 'Produk berhasil ditambahkan', 'product' => $product], 210);
    }

    public function update(Request $request, $id)
    {
        $product = Product::find($id);
        if (!$product) {
            return response()->json(['message' => 'Produk tidak ditemukan'], 404);
        }

        $validator = Validator::make($request->all(), [
            'code' => 'required|string|unique:products,code,' . $id,
            'name' => 'required|string|min:2',
            'category' => 'nullable|string',
            'category_id' => 'nullable',
            'price' => 'required|numeric|min:0',
            'stock' => 'required|numeric|min:0',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Input produk tidak valid', 'errors' => $validator->errors()], 422);
        }

        $data = $request->all();

        // Resolve category name if missing
        if (empty($data['category'])) {
            if (!empty($data['category_id'])) {
                $cat = Category::find($data['category_id']);
                $data['category'] = $cat ? $cat->name : '-';
            }
        }

        $product->update($data);

        return response()->json(['message' => 'Produk berhasil diperbarui', 'product' => $product]);
    }

    public function destroy($id)
    {
        $product = Product::find($id);
        if (!$product) {
            return response()->json(['message' => 'Produk tidak ditemukan'], 404);
        }

        $product->delete();

        return response()->json(['message' => 'Produk berhasil dihapus']);
    }
}
