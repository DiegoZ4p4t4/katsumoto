import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wheat, Loader2, MailCheck } from "lucide-react";

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    orgName: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setLoading(true);
    try {
      const { needsConfirmation } = await signUp(form.email, form.password, form.fullName, form.orgName);
      if (needsConfirmation) {
        setSuccess(true);
      } else {
        navigate("/");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-950 via-orange-900 to-orange-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MailCheck className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">¡Cuenta creada!</h1>
          </div>

          <Card className="rounded-2xl shadow-2xl border-0 bg-white dark:bg-slate-900 dark:border dark:border-slate-700">
            <CardContent className="pt-6 pb-6">
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Enviamos un correo de confirmación a <strong className="text-foreground">{form.email}</strong>.
                </p>
                <p className="text-sm text-muted-foreground">
                  Revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.
                </p>
                <Link
                  to="/login"
                  className="inline-block w-full text-center rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 transition-colors"
                >
                  Ir a Iniciar Sesión
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-950 via-orange-900 to-orange-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Wheat className="w-8 h-8 text-orange-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">Katsumoto</h1>
          <p className="text-orange-300/60 mt-1">Crear nueva cuenta</p>
        </div>

        <Card className="rounded-2xl shadow-2xl border-0 bg-white dark:bg-slate-900 dark:border dark:border-slate-700">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Registro</CardTitle>
            <CardDescription>Crea tu cuenta y la de tu empresa</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre Completo *</Label>
                <Input
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="rounded-xl"
                  placeholder="Juan Pérez"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Nombre de la Empresa *</Label>
                <Input
                  value={form.orgName}
                  onChange={(e) => setForm({ ...form, orgName: e.target.value })}
                  className="rounded-xl"
                  placeholder="Mi Agroempresa S.A.S"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Correo Electrónico *</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="rounded-xl"
                  placeholder="tu@empresa.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Contraseña *</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="rounded-xl"
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/50 dark:text-red-400 p-3 rounded-xl">{error}</p>
              )}
              <Button
                type="submit"
                className="w-full rounded-xl bg-orange-600 hover:bg-orange-700 h-11"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {loading ? "Creando cuenta..." : "Crear Cuenta"}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-6">
              ¿Ya tienes cuenta?{" "}
              <Link to="/login" className="text-orange-600 dark:text-orange-400 font-medium hover:underline">
                Inicia sesión
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}