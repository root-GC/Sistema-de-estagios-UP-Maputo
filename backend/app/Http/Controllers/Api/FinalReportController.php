<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Faculty;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Models\Internship;
use App\Models\FinalReport;

class FinalReportController extends Controller
{
    public function store(Request $request, Internship $internship): JsonResponse
    {
        $data = $request->validate([
            'file' => 'required|file|mimes:pdf,doc,docx|max:10240',
        ]);

        $path = $request->file('file')->store('final_reports', 'public');

        $report = $internship->finalReport()->create([
            'file_path'    => $path,
            'submitted_at' => now(),
        ]);

        return response()->json($report, 201);
    }
}