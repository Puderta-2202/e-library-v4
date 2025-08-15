<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserManagementApiController extends Controller
{
    public function index(Request $request)
    {
        $users = \App\Models\User::select('id', 'name', 'email', 'role_id', 'bidang_id')
            ->with([
                'role:id,name',
                'bidang:id,nama',   // <-- ini penting
            ])
            ->orderBy('name')
            ->get();

        return $users;
    }

    public function store(Request $r)
    {
        $data = $r->validate([
            'name'      => ['required', 'string', 'max:255'],
            'email'     => ['required', 'email', 'max:255', 'unique:users,email'],
            'password'  => ['required', 'string', 'min:8'],
            // role opsional; default akan diset 'pegawai'
            'role'      => ['nullable', Rule::in(['admin', 'pegawai'])],
            'bidang_id' => ['nullable', 'integer', 'exists:bidang,id'],
        ]);

        // default role jika tidak dikirim, sekaligus normalisasi ke lowercase
        $roleName = strtolower($data['role'] ?? 'pegawai');
        $role     = Role::firstOrCreate(['name' => $roleName]);

        $user = User::create([
            'name'      => $data['name'],
            'email'     => $data['email'],
            'password'  => Hash::make($data['password']),
            'role_id'   => $role->id,
            'bidang_id' => $data['bidang_id'] ?? null,
        ]);

        return response()->json($user->only('id', 'name', 'email', 'role_id', 'bidang_id'), 201);
    }

    public function update(Request $r, $id)
    {
        $user = User::findOrFail($id);

        $data = $r->validate([
            'name'      => ['sometimes', 'string', 'max:255'],
            'email'     => ['sometimes', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password'  => ['sometimes', 'nullable', 'string', 'min:8'],
            // boleh dikosongkan (tidak mengubah role)
            'role'      => ['sometimes', 'nullable', Rule::in(['admin', 'pegawai'])],
            'bidang_id' => ['nullable', 'integer', 'exists:bidang,id'],
        ]);

        // ubah role hanya jika field 'role' disertakan dan tidak null/kosong
        if (array_key_exists('role', $data) && !empty($data['role'])) {
            $roleName       = strtolower($data['role']);
            $data['role_id'] = Role::firstOrCreate(['name' => $roleName])->id;
        }
        unset($data['role']); // jangan simpan kolom 'role' mentah

        // jika password dikirim kosong → abaikan, jika ada → hash
        if (array_key_exists('password', $data)) {
            if ($data['password']) {
                $data['password'] = Hash::make($data['password']);
            } else {
                unset($data['password']);
            }
        }

        $user->update($data);

        return $user->only('id', 'name', 'email', 'role_id', 'bidang_id');
    }

    public function destroy($id)
    {
        User::findOrFail($id)->delete();
        return response()->noContent();
    }
}