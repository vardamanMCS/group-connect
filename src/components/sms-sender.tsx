'use client';

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatPhone } from '@/lib/utils';
import {
  Send,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Smartphone,
  Loader2,
} from 'lucide-react';

interface SmsSenderProps {
  phone: string;
  message: string;
  contactName: string;
  messageId: string;
  groupMemberId?: string;
  onSent?: () => void;
}

/**
 * Detect whether the device is iOS or Android to use the correct
 * sms: URI separator.
 * - iOS: sms:phone&body=message
 * - Android / desktop: sms:phone?body=message
 */
function getSmsUri(phone: string, message: string): string {
  const encoded = encodeURIComponent(message);
  const isIOS =
    typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent);

  if (isIOS) {
    return `sms:${phone}&body=${encoded}`;
  }
  return `sms:${phone}?body=${encoded}`;
}

export default function SmsSender({
  phone,
  message,
  contactName,
  messageId,
  groupMemberId,
  onSent,
}: SmsSenderProps) {
  const [status, setStatus] = useState<'idle' | 'confirming' | 'updating' | 'sent' | 'failed'>(
    'idle',
  );
  const [expanded, setExpanded] = useState(false);

  // -----------------------------------------------------------------------
  // Open native SMS app
  // -----------------------------------------------------------------------
  const handleSend = useCallback(() => {
    const uri = getSmsUri(phone, message);
    window.location.href = uri;

    // After 2 seconds, show the confirmation dialog
    setTimeout(() => {
      setStatus('confirming');
    }, 2000);
  }, [phone, message]);

  // -----------------------------------------------------------------------
  // Confirm the message was sent
  // -----------------------------------------------------------------------
  const confirmSent = useCallback(async () => {
    setStatus('updating');
    const supabase = createClient();

    try {
      // Mark the message as sent
      const { error: msgError } = await supabase
        .from('messages')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', messageId);

      if (msgError) throw msgError;

      // Also update the group_member status to 'invited' if provided
      if (groupMemberId) {
        await supabase
          .from('group_members')
          .update({ status: 'invited' })
          .eq('id', groupMemberId);
      }

      setStatus('sent');
      onSent?.();
    } catch (err) {
      console.error('Erreur lors de la mise a jour:', err);
      setStatus('failed');
    }
  }, [messageId, groupMemberId, onSent]);

  // -----------------------------------------------------------------------
  // Cancel / decline
  // -----------------------------------------------------------------------
  const cancelSend = useCallback(() => {
    setStatus('idle');
  }, []);

  // -----------------------------------------------------------------------
  // Preview text (truncated)
  // -----------------------------------------------------------------------
  const previewText =
    message.length > 100 ? message.slice(0, 100) + '\u2026' : message;

  // Already sent state
  if (status === 'sent') {
    return (
      <div className="flex items-center gap-3 bg-[#2D6A4F]/10 rounded-xl p-4">
        <CheckCircle2 className="w-5 h-5 text-[#2D6A4F] flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#2D6A4F]">SMS envoy&eacute;</p>
          <p className="text-sm text-[#2D6A4F]/70 truncate">{contactName}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Contact header */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-[#1B4965]/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5 text-[#1B4965]" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 truncate">{contactName}</p>
              <p className="text-sm text-gray-500">{formatPhone(phone)}</p>
            </div>
          </div>
        </div>

        {/* Message preview */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-3 w-full text-left flex items-start justify-between gap-2 min-h-[44px]"
        >
          <p className="text-sm text-gray-600 flex-1">
            {expanded ? message : previewText}
          </p>
          {message.length > 100 && (
            <span className="flex-shrink-0 mt-0.5">
              {expanded ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </span>
          )}
        </button>
      </div>

      {/* Confirmation dialog */}
      {status === 'confirming' && (
        <div className="border-t border-gray-100 bg-[#F8F6F0] p-4">
          <p className="text-sm font-semibold text-gray-900 mb-3">
            Avez-vous envoy&eacute; le SMS ?
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={confirmSent}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-[#2D6A4F] text-white px-4 py-3 rounded-xl font-semibold text-sm hover:bg-[#245740] active:bg-[#1b4432] transition-colors min-h-[48px]"
            >
              <CheckCircle2 className="w-5 h-5" />
              Oui, envoy&eacute;
            </button>
            <button
              type="button"
              onClick={cancelSend}
              className="flex-1 inline-flex items-center justify-center gap-2 border-2 border-gray-300 text-gray-700 px-4 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 active:bg-gray-100 transition-colors min-h-[48px]"
            >
              <XCircle className="w-5 h-5" />
              Non
            </button>
          </div>
        </div>
      )}

      {/* Updating state */}
      {status === 'updating' && (
        <div className="border-t border-gray-100 bg-[#F8F6F0] p-4 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 text-[#1B4965] animate-spin" />
          <span className="text-sm font-medium text-gray-600">Mise &agrave; jour...</span>
        </div>
      )}

      {/* Failed state */}
      {status === 'failed' && (
        <div className="border-t border-gray-100 bg-red-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-5 h-5 text-[#722F37]" />
            <p className="text-sm font-semibold text-[#722F37]">
              Erreur de mise &agrave; jour
            </p>
          </div>
          <button
            type="button"
            onClick={confirmSent}
            className="text-sm font-medium text-[#1B4965] underline min-h-[44px]"
          >
            R&eacute;essayer
          </button>
        </div>
      )}

      {/* Send action */}
      {(status === 'idle') && (
        <div className="border-t border-gray-100 p-4">
          <button
            type="button"
            onClick={handleSend}
            className="w-full inline-flex items-center justify-center gap-2 bg-[#1B4965] text-white px-4 py-3.5 rounded-xl font-semibold text-base hover:bg-[#153a52] active:bg-[#0f2d40] transition-colors min-h-[52px]"
          >
            <Send className="w-5 h-5" />
            Envoyer par SMS
          </button>
        </div>
      )}
    </div>
  );
}
