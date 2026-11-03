<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CategoryController extends Controller
{
    public function index()
    {
        return response()->json(Category::all());
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|unique:categories,name',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Nama kategori tidak valid atau sudah ada', 'errors' => $validator->errors()], 422);
        }

        $category = Category::create([
            'name' => $request->input('name')
        ]);

        return response()->json(['message' => 'Kategori berhasil ditambahkan', 'category' => $category], 210);
    }

    public function update(Request $request, $id)
    {
        $category = Category::find($id);
        if (!$category) {
            return response()->json(['message' => 'Kategori tidak ditemukan'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|unique:categories,name,' . $id,
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Nama kategori tidak valid atau sudah ada', 'errors' => $validator->errors()], 422);
        }

        $oldName = $category->name;
        $newName = $request->input('name');

        $category->update(['name' => $newName]);

        // Cascade Update: Update category name on all related products
        Product::where('category', $oldName)->update(['category' => $newName]);

        return response()->json(['message' => 'Kategori berhasil diperbarui', 'category' => $category]);
    }

    public function destroy($id)
    {
        $category = Category::find($id);
        if (!$category) {
            return response()->json(['message' => 'Kategori tidak ditemukan'], 404);
        }

        $catName = $category->name;

        // Mencegah penghapusan kategori fallback 'Lainnya'
        if (strtolower($catName) === 'lainnya') {
            return response()->json(['message' => 'Kategori default "Lainnya" tidak dapat dihapus!'], 400);
        }

        // Pastikan kategori fallback 'Lainnya' ada
        $fallback = Category::where('name', 'Lainnya')->first();
        if (!$fallback) {
            $fallback = Category::create(['name' => 'Lainnya']);
        }

        // Cascade Delete: Move all products in this category to 'Lainnya'
        Product::where('category', $catName)->update(['category' => $fallback->name]);

        $category->delete();

        return response()->json(['message' => 'Kategori berhasil dihapus dan produk dialihkan ke "Lainnya"']);
    }
}
