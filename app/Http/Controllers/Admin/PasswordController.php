<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class PasswordController extends Controller
{
    /**
     * Verificar contraseña del super admin y mostrar contraseña del usuario
     */
    public function revealPassword(Request $request, User $user)
    {
        // Solo super_admin puede acceder
        if (Auth::user()->tipo_cuenta !== 'super_admin') {
            abort(403, 'Acceso denegado');
        }

        $request->validate([
            'admin_password' => 'required|string',
        ]);

        // Verificar contraseña del super admin actual
        if (! Hash::check($request->admin_password, Auth::user()->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Contraseña del administrador incorrecta',
            ], 400);
        }

        // Obtener la contraseña recuperable
        $plainPassword = null;
        if ($user->recoverable_password) {
            try {
                $plainPassword = Crypt::decryptString($user->recoverable_password);
            } catch (\Exception $e) {
                $plainPassword = 'No disponible (encriptación antigua)';
            }
        }

        return response()->json([
            'success' => true,
            'password' => $plainPassword,
            'user_name' => $user->name,
            'user_email' => $user->email,
        ]);
    }

    /**
     * Restablecer contraseña de un usuario
     */
    public function resetPassword(Request $request, User $user)
    {
        // Solo super_admin puede acceder
        if (Auth::user()->tipo_cuenta !== 'super_admin') {
            abort(403, 'Acceso denegado');
        }

        $request->validate([
            'admin_password' => 'required|string',
            'new_password' => 'nullable|string|min:8',
        ]);

        // Verificar contraseña del super admin actual
        if (! Hash::check($request->admin_password, Auth::user()->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Contraseña del administrador incorrecta',
            ], 400);
        }

        // Generar nueva contraseña si no se proporciona una
        $newPassword = $request->new_password ?? $this->generateSecurePassword();

        // Actualizar contraseña del usuario
        $user->update([
            'password' => Hash::make($newPassword),
            'recoverable_password' => Crypt::encryptString($newPassword),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Contraseña restablecida exitosamente',
            'new_password' => $newPassword,
            'user_name' => $user->name,
            'user_email' => $user->email,
        ]);
    }

    /**
     * Generar contraseña segura
     */
    private function generateSecurePassword(): string
    {
        // Generar contraseña segura de 12 caracteres
        $password = Str::upper(Str::random(3)). // 3 mayúsculas
                   Str::lower(Str::random(3)). // 3 minúsculas
                   rand(100, 999). // 3 números
                   Str::random(3); // 3 caracteres aleatorios

        return str_shuffle($password); // Mezclar caracteres
    }
}
