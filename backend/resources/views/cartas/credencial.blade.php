<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="utf-8">
    <title>Cartas de Estágio</title>
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
        .page-break { page-break-before: always; }
        .campus-header { text-align: center; font-size: 10pt; margin-bottom: 30px; }
        .credencial-title { text-align: center; font-size: 16pt; font-weight: bold; margin: 30px 0; }
        .institution-name { text-align: center; font-size: 14pt; font-weight: bold; margin: 20px 0; }
    </style>
</head>
<body>
    {{-- PÁGINA 1: Pedido de Vaga --}}
    <div class="header">
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

    {{-- PÁGINA 2: Credencial --}}
    <div class="page-break"></div>

    <div class="campus-header">
        Campus de Lhanguene, Av. de Trabalho 2482, Tel: (+258) 822414880 / 860628899, Maputo - Moçambique
    </div>

    <div class="credencial-title">CREDENCIAL</div>

    <div class="institution-name">{{ $instituicaoNome ?? 'Anónimo' }}</div>

    <div class="content">
        <p>
            Credencia-se o Sr. <strong>{{ $internship->student->user->name }}</strong>,
            portador de Bilhete de Identidade número <strong>{{ $biNumero ?? 'Anónimo' }}</strong>,
            emitido pelo Arquivo de Identificação Civil da Cidade de Maputo,
            aos {{ $biDataEmissao ?? '29 de Maio de 2024' }},
            Filho de <strong>{{ $paiNome ?? 'Anónimo' }}</strong>
            e de <strong>{{ $maeNome ?? 'Anónimo' }}</strong>,
            estudante de {{ $internship->student->current_year }}º ano,
            Curso de <strong>{{ $internship->student->course->name }}</strong>
            com Habilitação em <em>{{ $internship->student->course->name ?? 'Engenharia de Desenvolvimento de Sistemas' }}</em>,
            a fim de efectuar Estágio Profissional, junto aos especialistas na área de
            <strong>{{ $areaEstagio ?? 'Engenharia de Desenvolvimento de Sistemas' }}</strong>.
        </p>
        <p>
            Mais se informa que a duração do estágio será de <strong>{{ $duracaoDias ?? '90' }} dias</strong>.
        </p>
    </div>

    <div class="signature">
        <p>Maputo, aos {{ now()->isoFormat('D [de] MMMM [de] Y') }}</p>
        <p>O Chefe de Repartição de Práticas Técnico-Profissionais</p>
        <p>_________________________________</p>
        <p class="director">{{ $chefeReparticaoNome ?? 'Dr. Justino António Moiane' }}</p>
        <div class="contact">Contacto: {{ $chefeReparticaoContacto ?? '842747689' }}</div>
    </div>
</body>
</html>