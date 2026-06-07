<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ResetPasswordNotification extends Notification
{
    use Queueable;

    public string $token;

    public function __construct(string $token)
    {
        $this->token = $token;
    }

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
{
    $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
    $resetUrl = $frontendUrl . '/reset-password?token=' . $this->token . '&email=' . urlencode($notifiable->email);

    return (new MailMessage)
        ->subject('Recuperar Palavra‑passe')
        ->line('Está a receber este email porque foi pedida uma redefinição da palavra‑passe.')
        ->line('[Redefinir Palavra‑passe](' . $resetUrl . ')')   // link Markdown
        ->line('Este link expira em 60 minutos.')
        ->line('Se não pediu esta alteração, ignore este email.');
}
}