<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class EmployeeController extends Controller
{
    public function index()
    {
        // Only return employees, not admin users
        return response()->json(User::where('role', 'Karyawan')->get());
    }

    public function update(Request $request, $id)
    {
        $employee = User::where('id', $id)->where('role', 'Karyawan')->first();
        if (!$employee) {
            return response()->json(['message' => 'Akun karyawan tidak ditemukan'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|min:2',
            'position' => 'required|string|min:2',
            'email' => 'required|email|unique:users,email,' . $id,
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Input tidak valid', 'errors' => $validator->errors()], 422);
        }

        $employee->update([
            'name' => $request->input('name'),
            'position' => $request->input('position'),
            'email' => $request->input('email'),
        ]);

        return response()->json(['message' => 'Detail karyawan berhasil disimpan', 'employee' => $employee]);
    }

    public function verify(Request $request, $id)
    {
        $employee = User::where('id', $id)->where('role', 'Karyawan')->first();
        if (!$employee) {
            return response()->json(['message' => 'Akun karyawan tidak ditemukan'], 404);
        }

        $validator = Validator::make($request->all(), [
            'code' => 'required|string|min:3|unique:users,code',
            'password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Verifikasi gagal', 'errors' => $validator->errors()], 422);
        }

        $employee->update([
            'code' => $request->input('code'),
            'password' => Hash::make($request->input('password')),
            'status' => 'Aktif',
        ]);

        return response()->json(['message' => 'Akun karyawan berhasil diverifikasi dan aktif', 'employee' => $employee]);
    }

    public function resetPassword(Request $request, $id)
    {
        $employee = User::where('id', $id)->where('role', 'Karyawan')->first();
        if (!$employee) {
            return response()->json(['message' => 'Akun karyawan tidak ditemukan'], 404);
        }

        $validator = Validator::make($request->all(), [
            'password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Reset password gagal', 'errors' => $validator->errors()], 422);
        }

        $employee->update([
            'password' => Hash::make($request->input('password'))
        ]);

        return response()->json(['message' => 'Password karyawan berhasil disetel ulang']);
    }

    public function toggleStatus($id)
    {
        $employee = User::where('id', $id)->where('role', 'Karyawan')->first();
        if (!$employee) {
            return response()->json(['message' => 'Akun karyawan tidak ditemukan'], 404);
        }

        $nextStatus = $employee->status === 'Aktif' ? 'Nonaktif' : 'Aktif';
        $employee->update(['status' => $nextStatus]);

        return response()->json(['message' => "Akun karyawan berhasil diubah menjadi {$nextStatus}", 'employee' => $employee]);
    }
}
