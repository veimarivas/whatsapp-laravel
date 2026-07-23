<?php

namespace App\Console\Commands;

use App\Models\Account;
use App\Models\AiKnowledgeDocument;
use App\Services\Ai\Chunker;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Sincroniza la oferta académica ESAM (BD `esam_datos`) → documentos de
 * la base de conocimiento del wacrm que consume la IA.
 *
 * Genera UN documento por cada programa en estado "Inscripciones" (id=4),
 * anidando su tipo, módulos, docentes y próximos horarios. Cada corrida
 * borra los documentos anteriores marcados con el prefijo [OFERTA] y los
 * regenera desde cero — así siempre queda sincronizado.
 *
 * Uso:
 *   php artisan wacrm:sync-oferta-academica            # cuenta por defecto (primera)
 *   php artisan wacrm:sync-oferta-academica --account=UUID
 */
class SyncOfertaAcademica extends Command
{
    protected $signature = 'wacrm:sync-oferta-academica {--account=} {--dry-run : Solo mostrar cuántos programas se importarían}';

    protected $description = 'Importa programas ESAM en inscripciones + módulos/horarios/docentes como base de conocimiento IA';

    private const DOC_PREFIX = '[OFERTA] ';
    private const ESTADO_INSCRIPCIONES = 4;

    public function handle(Chunker $chunker): int
    {
        $accountId = $this->option('account')
            ?? Account::query()->orderBy('created_at')->value('id');

        if (! $accountId) {
            $this->error('No hay ninguna cuenta configurada en el wacrm.');
            return self::FAILURE;
        }

        $this->info("Cuenta: {$accountId}");

        // 1. Traigo programas en Inscripciones con su tipo.
        $programas = DB::connection('esam_datos')
            ->table('programas as p')
            ->leftJoin('tipos as t', 't.id', '=', 'p.tipo_id')
            ->where('p.estado_id', self::ESTADO_INSCRIPCIONES)
            ->select([
                'p.id', 'p.nombre', 'p.codigo', 'p.gestion',
                'p.duracion_meses', 'p.fecha_inicio', 'p.fecha_conclusion',
                'p.hora_inicio', 'p.hora_fin',
                'p.matricula', 'p.colegiatura', 'p.n_modulos',
                'p.moodle_link', 'p.ceub', 'p.inscripciones_habilitadas',
                'p.cantidad_inscritos_minimo',
                't.nombre as tipo_nombre', 't.descripcion as tipo_descripcion',
                't.cantidad_modulo as tipo_cantidad_modulo',
            ])
            ->orderBy('p.nombre')
            ->get();

        $this->info("Programas en Inscripciones: {$programas->count()}");

        if ($this->option('dry-run')) {
            foreach ($programas as $p) {
                $this->line("  · [{$p->codigo}] {$p->nombre} ({$p->tipo_nombre})");
            }
            return self::SUCCESS;
        }

        // 2. Wipe de documentos [OFERTA] previos.
        $deleted = AiKnowledgeDocument::forAccount($accountId)
            ->where('title', 'like', self::DOC_PREFIX.'%')
            ->delete();
        $this->info("Documentos previos eliminados: {$deleted}");

        // 3. Por cada programa, genero un documento con todo anidado.
        $bar = $this->output->createProgressBar($programas->count());
        $bar->start();

        $created = 0;
        foreach ($programas as $p) {
            $content = $this->buildContent($p);

            $doc = AiKnowledgeDocument::create([
                'account_id' => $accountId,
                // Título limpio: sin código ni prefijos ruidosos (el código queda
                // dentro del contenido, sigue siendo buscable pero no lo cita la IA
                // cuando lista programas).
                'title' => self::DOC_PREFIX.$p->nombre,
                'content' => $content,
            ]);

            $chunker->reindex($doc);
            $created++;
            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);
        $this->info("✅ {$created} programas indexados.");

        return self::SUCCESS;
    }

    /** Arma el texto completo (programa + módulos + docentes + horarios). */
    private function buildContent(object $p): string
    {
        $lines = [
            "Programa: {$p->nombre}",
            "Código: {$p->codigo}",
            "Tipo: {$p->tipo_nombre}".($p->tipo_descripcion ? " ({$p->tipo_descripcion})" : ''),
            "Gestión: {$p->gestion}",
            'Estado: Inscripciones abiertas',
        ];

        if ($p->duracion_meses) {
            $lines[] = "Duración: {$p->duracion_meses} meses";
        }
        if ($p->fecha_inicio) {
            $lines[] = "Fecha inicio: {$p->fecha_inicio}";
        }
        if ($p->fecha_conclusion) {
            $lines[] = "Fecha conclusión: {$p->fecha_conclusion}";
        }
        if ($p->hora_inicio && $p->hora_fin && $p->hora_inicio !== '00:00:00') {
            $lines[] = "Horario general: {$p->hora_inicio} a {$p->hora_fin}";
        }
        if ((float) $p->matricula > 0) {
            $lines[] = 'Matrícula: '.number_format((float) $p->matricula, 2).' Bs';
        }
        if ((float) $p->colegiatura > 0) {
            $lines[] = 'Colegiatura: '.number_format((float) $p->colegiatura, 2).' Bs';
        }
        if ($p->n_modulos > 0) {
            $lines[] = "Cantidad total de módulos: {$p->n_modulos}";
        }
        if ($p->ceub) {
            $lines[] = 'Certificación CEUB: Sí';
        }
        if ($p->inscripciones_habilitadas) {
            $lines[] = 'Inscripciones habilitadas: Sí';
        }
        if ($p->cantidad_inscritos_minimo > 0) {
            $lines[] = "Cupo mínimo para iniciar: {$p->cantidad_inscritos_minimo} inscritos";
        }

        // Módulos con docente
        $modulos = DB::connection('esam_datos')
            ->table('modulos as m')
            ->leftJoin('docentes as d', 'd.id', '=', 'm.docente_id')
            ->where('m.programa_id', $p->id)
            ->select([
                'm.id', 'm.nombre',
                'd.nombres as docente_nombres', 'd.apellidos as docente_apellidos',
                'd.correo as docente_correo',
            ])
            ->orderBy('m.id')
            ->get();

        if ($modulos->isNotEmpty()) {
            $lines[] = '';
            $lines[] = 'MÓDULOS DEL PROGRAMA:';

            foreach ($modulos as $i => $m) {
                $num = $i + 1;
                $lines[] = "{$num}. ".trim($m->nombre);

                if ($m->docente_nombres) {
                    // Solo nombre completo del docente — sin correo ni contacto
                    // (esa info es interna, el cliente no la necesita ni debe verla).
                    $docenteFullName = trim("{$m->docente_nombres} {$m->docente_apellidos}");
                    $lines[] = "   Docente: {$docenteFullName}";
                }

                // Todos los horarios confirmados del módulo, en orden cronológico.
                // Un módulo puede tener varias sesiones (una por semana) y el
                // cliente puede querer verlas todas para planificar.
                $horarios = DB::connection('esam_datos')
                    ->table('horarios')
                    ->where('modulo_id', $m->id)
                    ->where('estado', 'Confirmado')
                    ->orderBy('fecha_desarrollo')
                    ->orderBy('hora_inicio')
                    ->limit(50) // cota razonable: un semestre de clases semanales ≈ 16
                    ->get(['fecha_desarrollo', 'hora_inicio', 'hora_fin']);

                if ($horarios->isNotEmpty()) {
                    $lines[] = '   Todos los horarios de este módulo (orden cronológico):';
                    foreach ($horarios as $h) {
                        $lines[] = "     - {$h->fecha_desarrollo} de {$h->hora_inicio} a {$h->hora_fin}";
                    }
                }
                $lines[] = '';
            }
        }

        return implode("\n", $lines);
    }
}
