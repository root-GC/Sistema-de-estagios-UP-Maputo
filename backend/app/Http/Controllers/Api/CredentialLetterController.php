<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\{Request, JsonResponse};
use App\Models\{CredentialLetter, Internship, Notification};
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class CredentialLetterController extends Controller
{
    /** Lista todas as cartas emitidas */
    public function index(): JsonResponse
    {
        $letters = CredentialLetter::with('internship.student.user')
            ->orderByDesc('generated_at')
            ->get()
            ->map(fn($l) => [
                'id'              => $l->id,
                'internship_id'   => $l->internship_id,
                'file_path' => asset(Storage::url($l->file_path)),  // URL pública
                'generated_at'    => $l->generated_at,
                'student_name'    => $l->internship->student->user->name ?? '—',
            ]);

        return response()->json(['data' => $letters]);
    }

    /** Gera a carta em PDF e guarda‑a */
    public function generate(Request $request, Internship $internship): JsonResponse
    {
        // Carregar relações necessárias
        $internship->load('student.user', 'student.course', 'period');

        $periodoTexto  = $internship->period->semester ?? '1';            // ajusta conforme o teu modelo
        $duracaoMeses = $internship->student->course->duration_years
                        ? ($internship->student->course->duration_years < 5 ? '3 (três) meses' : '6 (seis) meses')
                        : '3 (três) meses';

        // Gerar o PDF
        $pdf = Pdf::loadView('cartas.credencial', compact('internship', 'periodoTexto', 'duracaoMeses'));

        // Definir caminho de armazenamento
        $filename = "carta_estagio_{$internship->id}_" . now()->timestamp . ".pdf";
        $folder   = 'public/cartas';               // storage/app/public/cartas/
        $path     = $folder . '/' . $filename;

        Storage::put($path, $pdf->output());

        $letter = CredentialLetter::create([
            'internship_id' => $internship->id,
            'file_path'     => $path,
            'generated_by'  => $request->user()->id,
            'generated_at'  => now(),
        ]);

        Notification::create([
            'user_id' => $internship->student->user->id,
            'title'   => 'Carta Credencial Disponível',
            'message' => 'A sua carta credencial foi gerada pelo coordenador.',
        ]);

        // Retornar o URL público para o frontend
        $letter->file_url = Storage::url($letter->file_path);

        return response()->json($letter, 201);
    }
}