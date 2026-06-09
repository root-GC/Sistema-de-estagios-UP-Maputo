<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="utf-8">
    <title>Carta Credencial</title>
    <style>
        body { font-family: 'DejaVu Serif', serif; font-size: 12pt; line-height: 1.6; margin: 2cm 2.5cm; }
        .header { text-align: right; margin-bottom: 20px; }
        .ref { font-weight: bold; }
        .date { margin-top: 30px; }
        .subject { font-weight: bold; margin: 30px 0 10px; }
        .content { text-align: justify; }
        .signature { margin-top: 70px; }
        .director { font-weight: bold; }
        .director-title { font-style: italic; }
        .contact { margin-top: 20px; font-size: 10pt; }
    </style>
</head>
<body>
    <div class="header">
        {{-- Usa $internship->id (não $letter) --}}
        <div class="ref">N/Refª {{ $internship->id }}/FET/UPM/{{ date('Y') }}</div>
        <div class="date">Maputo, {{ now()->isoFormat('D [de] MMMM [de] Y') }}</div>
    </div>

    <div class="subject">Assunto: Pedido de Vaga para Realização de Estágio Técnico-Profissional</div>

    <div class="content">
        <p>
            No âmbito de preparação de actividades de estágio Técnico-profissional para o
            {{ $periodoTexto }} semestre de {{ now()->year }}, a Direcção da Faculdade de Engenharias e Tecnologias (FET),
            da Universidade Pedagógica de Maputo, vem por meio desta, solicitar à V.Excia se digne autorizar a realização
            do Estágio Técnico-profissional, para o(a) estudante <strong>{{ $internship->student->user->name }}</strong>,
            do {{ $internship->student->current_year }}º Ano, curso de <strong>{{ $internship->student->course->name }}</strong>,
            com Habilitações em <em>{{ $internship->student->course->name ?? 'Informática' }}</em>, por um período de
            <strong>{{ $duracaoMeses }}</strong>.
        </p>
        <p>
            De acordo com as actividades que o estagiário irá realizar, no final do mesmo ser-lhe-á atribuída
            uma classificação pelo tutor local indicado por V. Excia para o seu acompanhamento.
        </p>
        <p>
            Cientes de que o assunto merecerá a vossa atenção, subscrevemo-nos com elevada consideração.
        </p>
    </div>

    <div class="signature">
        <p>O Director da Faculdade</p>
        <p>_______________________________________</p>
        <p class="director">Prof. Doutor Manuel Joaquim Silva de Oliveira</p>
        <p class="director-title">(Docente Universitário)</p>
        <div class="contact">Contacto: 873451693</div>
    </div>
</body>
</html>