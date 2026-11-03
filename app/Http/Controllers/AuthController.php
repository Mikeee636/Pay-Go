<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Input tidak valid', 'errors' => $validator->errors()], 422);
        }

        $username = $request->input('username');
        $password = $request->input('password');

        // Look up by email (Admin / Employee email attempt) or code
        $user = null;
        if (str_contains($username, '@')) {
            $user = User::where('email', $username)->first();
        } else {
            $user = User::where('code', $username)->first();
        }

        if (!$user) {
            return response()->json(['message' => 'Login gagal. Silakan periksa kembali Nomor Karyawan/Email dan Password Anda.'], 401);
        }

        // Status checks
        if ($user->status === 'Belum Diverifikasi') {
            return response()->json(['message' => 'Login gagal. Akun Anda belum diverifikasi oleh Admin.'], 403);
        }

        if ($user->status === 'Nonaktif') {
            return response()->json(['message' => 'Login gagal. Akun Anda telah dinonaktifkan. Silakan hubungi Admin.'], 403);
        }

        // Verify password
        if (!Hash::check($password, $user->password)) {
            return response()->json(['message' => 'Login gagal. Silakan periksa kembali Nomor Karyawan/Email dan Password Anda.'], 401);
        }

        // Successful authentication
        return response()->json([
            'message' => 'Login berhasil',
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'code' => $user->code,
                'role' => $user->role,
                'position' => $user->position,
            ]
        ]);
    }

    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|min:2',
            'position' => 'required|string|min:2',
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Input tidak valid', 'errors' => $validator->errors()], 422);
        }

        // Check if email already used
        $exists = User::where('email', $request->input('email'))->exists();
        if ($exists) {
            return response()->json(['message' => 'Email tersebut sudah terdaftar!'], 400);
        }

        // Register new employee user as pending
        User::create([
            'name' => $request->input('name'),
            'position' => $request->input('position'),
            'email' => $request->input('email'),
            'status' => 'Belum Diverifikasi',
            'role' => 'Karyawan',
            'code' => null,
            'password' => null,
        ]);

        return response()->json(['message' => 'Registrasi kasir berhasil diajukan. Menunggu verifikasi Admin.']);
    }
}
