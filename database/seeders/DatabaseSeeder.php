<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Category;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\TransactionItem;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Admin & Employee Users
        User::create([
            'name' => 'Administrator Pay & Go',
            'email' => 'admin@payandgo.com',
            'password' => Hash::make('admin123'),
            'role' => 'Admin',
            'status' => 'Aktif',
            'position' => 'Manager',
            'code' => null,
        ]);

        User::create([
            'name' => 'Budi Santoso',
            'email' => 'budi@payandgo.com',
            'password' => Hash::make('password123'),
            'role' => 'Karyawan',
            'status' => 'Aktif',
            'position' => 'Kasir Utama',
            'code' => '12345',
        ]);

        User::create([
            'name' => 'Siti Aminah',
            'email' => 'siti@payandgo.com',
            'password' => Hash::make('password123'),
            'role' => 'Karyawan',
            'status' => 'Aktif',
            'position' => 'Kasir Shift A',
            'code' => '12346',
        ]);

        User::create([
            'name' => 'Ahmad Hidayat',
            'email' => 'ahmad@payandgo.com',
            'password' => Hash::make('password123'),
            'role' => 'Karyawan',
            'status' => 'Aktif',
            'position' => 'Kasir Shift B',
            'code' => '12347',
        ]);

        // 2. Seed Categories
        $categories = ['Makanan', 'Minuman', 'Kebersihan', 'Lainnya'];
        foreach ($categories as $cat) {
            Category::create(['name' => $cat]);
        }

        // 3. Seed Products
        $products = [
            ['code' => '8991001', 'name' => 'Kopi Susu Gula Aren 250ml', 'price' => 18000, 'category' => 'Minuman', 'stock' => 100],
            ['code' => '8991002', 'name' => 'Roti Tawar Gandum FreshMarket', 'price' => 15000, 'category' => 'Makanan', 'stock' => 45],
            ['code' => '8991003', 'name' => 'Susu Cair UHT Full Cream 1L', 'price' => 22000, 'category' => 'Minuman', 'stock' => 60],
            ['code' => '8991004', 'name' => 'Teh Hijau Jasmine Botol 450ml', 'price' => 6000, 'category' => 'Minuman', 'stock' => 120],
            ['code' => '8991005', 'name' => 'Mie Instan Goreng Rasa Rendang', 'price' => 3500, 'category' => 'Makanan', 'stock' => 250],
            ['code' => '8991006', 'name' => 'Minyak Goreng Sawit Refill 2L', 'price' => 34000, 'category' => 'Makanan', 'stock' => 80],
            ['code' => '8991007', 'name' => 'Sabun Mandi Cair Lemon 400ml', 'price' => 26000, 'category' => 'Kebersihan', 'stock' => 35],
            ['code' => '8991008', 'name' => 'Peralatan Makan Sendok Garpu Set', 'price' => 12000, 'category' => 'Lainnya', 'stock' => 50]
        ];
        foreach ($products as $prod) {
            Product::create($prod);
        }

        // 4. Seed Historical Transactions
        $transactions = [
            [
                'id' => 'TRX-20260803-8712', 'date' => '2026-08-03', 'time' => '16:04', 'cashier' => 'Budi Santoso', 
                'subtotal' => 65765, 'tax' => 7235, 'total' => 73000,
                'items' => [
                    ['name' => 'Kopi Susu Gula Aren 250ml', 'qty' => 2, 'price' => 18000],
                    ['name' => 'Minyak Goreng Sawit Refill 2L', 'qty' => 1, 'price' => 34000]
                ]
            ],
            [
                'id' => 'TRX-20260803-1254', 'date' => '2026-08-03', 'time' => '15:52', 'cashier' => 'Budi Santoso',
                'subtotal' => 16216, 'tax' => 1784, 'total' => 18000,
                'items' => [
                    ['name' => 'Kopi Susu Gula Aren 250ml', 'qty' => 1, 'price' => 18000]
                ]
            ],
            [
                'id' => 'TRX-20260803-3498', 'date' => '2026-08-03', 'time' => '15:40', 'cashier' => 'Siti Aminah',
                'subtotal' => 112162, 'tax' => 12338, 'total' => 124500,
                'items' => [
                    ['name' => 'Roti Tawar Gandum FreshMarket', 'qty' => 2, 'price' => 15000],
                    ['name' => 'Susu Cair UHT Full Cream 1L', 'qty' => 3, 'price' => 22000]
                ]
            ],
            [
                'id' => 'TRX-20260803-6231', 'date' => '2026-08-03', 'time' => '15:15', 'cashier' => 'Ahmad Hidayat',
                'subtotal' => 37838, 'tax' => 4162, 'total' => 42000,
                'items' => [
                    ['name' => 'Susu Cair UHT Full Cream 1L', 'qty' => 1, 'price' => 22000],
                    ['name' => 'Teh Hijau Jasmine Botol 450ml', 'qty' => 3, 'price' => 6000]
                ]
            ],
            [
                'id' => 'TRX-20260803-9021', 'date' => '2026-08-03', 'time' => '14:50', 'cashier' => 'Siti Aminah',
                'subtotal' => 230630, 'tax' => 25370, 'total' => 256000,
                'items' => [
                    ['name' => 'Minyak Goreng Sawit Refill 2L', 'qty' => 5, 'price' => 34000],
                    ['name' => 'Sabun Mandi Cair Lemon 400ml', 'qty' => 3, 'price' => 26000]
                ]
            ]
        ];

        foreach ($transactions as $trxData) {
            $items = $trxData['items'];
            unset($trxData['items']);
            
            Transaction::create($trxData);
            
            foreach ($items as $item) {
                $item['transaction_id'] = $trxData['id'];
                TransactionItem::create($item);
            }
        }
    }
}
