<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\StockController;
use App\Http\Controllers\TransactionController;
use Illuminate\Support\Facades\Route;

// Authentication routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// Products CRUD routes
Route::get('/products', [ProductController::class, 'index']);
Route::post('/products', [ProductController::class, 'store']);
Route::put('/products/{id}', [ProductController::class, 'update']);
Route::delete('/products/{id}', [ProductController::class, 'destroy']);

// Categories CRUD routes
Route::get('/categories', [CategoryController::class, 'index']);
Route::post('/categories', [CategoryController::class, 'store']);
Route::put('/categories/{id}', [CategoryController::class, 'update']);
Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

// Stock adjustment route
Route::post('/stock/adjust', [StockController::class, 'adjust']);

// Employees administration routes
Route::get('/employees', [EmployeeController::class, 'index']);
Route::put('/employees/{id}', [EmployeeController::class, 'update']);
Route::post('/employees/{id}/verify', [EmployeeController::class, 'verify']);
Route::put('/employees/{id}/reset-password', [EmployeeController::class, 'resetPassword']);
Route::put('/employees/{id}/toggle-status', [EmployeeController::class, 'toggleStatus']);

// POS transaction routes
Route::post('/checkout', [TransactionController::class, 'checkout']);
Route::get('/transactions', [TransactionController::class, 'index']);
Route::delete('/transactions/{id}', [TransactionController::class, 'destroy']);
Route::delete('/transactions', [TransactionController::class, 'clearAll']);
Route::get('/sales/analytics', [TransactionController::class, 'analytics']);
