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
                'id'            => $l->id,
                'internship_id' => $l->internship_id,
                'file_path'     => asset(Storage::url($l->file_path)), // URL pública
                'generated_at'  => $l->generated_at,
                'student_name'  => $l->internship->student->user->name ?? '—',
            ]);

        return response()->json(['data' => $letters]);
    }

    /** Gera a carta em PDF e guarda-a */
    public function generate(Request $request, Internship $internship): JsonResponse
    {
        // Carrega relações
        $internship->load('student.user', 'student.course', 'period', 'institution');

        // Dados do estágio
        $periodoTexto = $internship->period->semester ?? '1';

        $duracaoMeses = $internship->student->course->duration_years
            ? ($internship->student->course->duration_years < 5
                ? '3 (três) meses'
                : '6 (seis) meses')
            : '3 (três) meses';

        // Instituição
        $instituicaoNome = $internship->institution->name
            ?? 'INSTITUTO SUPERIOR DE CIÊNCIAS DE SAÚDE';

        // Estudante
        $student = $internship->student;

        $biNumero       = $student->bi_numero ?? null;
        $biDataEmissao  = $student->bi_data_emissao ?? null;
        $paiNome        = $student->pai_nome ?? null;
        $maeNome        = $student->mae_nome ?? null;

        $areaEstagio = $student->course->name
            ?? 'Engenharia de Desenvolvimento de Sistemas';

        $duracaoDias = $student->course->duration_years == 4 ? '90' : '180';

        $chefeReparticaoNome     = 'Dr. Justino António Moiane';
        $chefeReparticaoContacto = '842747689';

        // Gera PDF
        $pdf = Pdf::loadView('cartas.credencial', compact(
            'internship',
            'periodoTexto',
            'duracaoMeses',
            'instituicaoNome',
            'biNumero',
            'biDataEmissao',
            'paiNome',
            'maeNome',
            'areaEstagio',
            'duracaoDias',
            'chefeReparticaoNome',
            'chefeReparticaoContacto'
        ));

        $filename = "carta_estagio_{$internship->id}_" . now()->timestamp . ".pdf";

        // ✅ CORREÇÃO PRINCIPAL: usar disco public
        $path = 'cartas/' . $filename;

        Storage::disk('public')->put(
            $path,
            $pdf->output()
        );

        // Guarda na BD
        $letter = CredentialLetter::create([
            'internship_id' => $internship->id,
            'file_path'     => $path,
            'generated_by'  => $request->user()->id,
            'generated_at'  => now(),
        ]);

        // Notificação
        Notification::create([
            'user_id' => $internship->student->user->id,
            'title'   => 'Carta Credencial Disponível',
            'message' => 'A sua carta credencial foi gerada pelo coordenador.',
        ]);

        // URL pública correta
        $letter->file_url = Storage::url($letter->file_path);

        return response()->json($letter, 201);
    }
}