import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

interface CalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Calculator({ isOpen, onClose }: CalculatorProps) {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<string | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [history, setHistory] = useState<string>('');

  const inputDigit = useCallback((digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  }, [display, waitingForOperand]);

  const inputDecimal = useCallback(() => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  }, [display, waitingForOperand]);

  const clear = useCallback(() => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
    setHistory('');
  }, []);

  const clearEntry = useCallback(() => {
    setDisplay('0');
    setWaitingForOperand(false);
  }, []);

  const toggleSign = useCallback(() => {
    const value = parseFloat(display);
    setDisplay(String(-value));
  }, [display]);

  const inputPercent = useCallback(() => {
    const value = parseFloat(display);
    setDisplay(String(value / 100));
  }, [display]);

  const performOperation = useCallback((nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(display);
      setHistory(`${display} ${nextOperation}`);
    } else if (operation) {
      const currentValue = parseFloat(previousValue);
      let result: number;

      switch (operation) {
        case '+':
          result = currentValue + inputValue;
          break;
        case '-':
          result = currentValue - inputValue;
          break;
        case '*':
          result = currentValue * inputValue;
          break;
        case '/':
          result = inputValue !== 0 ? currentValue / inputValue : 0;
          break;
        default:
          result = inputValue;
      }

      const resultString = String(parseFloat(result.toFixed(10)));
      setDisplay(resultString);
      setPreviousValue(resultString);
      setHistory(`${resultString} ${nextOperation}`);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  }, [display, operation, previousValue]);

  const calculate = useCallback(() => {
    if (!operation || previousValue === null) return;

    const inputValue = parseFloat(display);
    const currentValue = parseFloat(previousValue);
    let result: number;

    switch (operation) {
      case '+':
        result = currentValue + inputValue;
        break;
      case '-':
        result = currentValue - inputValue;
        break;
      case '*':
        result = currentValue * inputValue;
        break;
      case '/':
        result = inputValue !== 0 ? currentValue / inputValue : 0;
        break;
      default:
        result = inputValue;
    }

    const resultString = String(parseFloat(result.toFixed(10)));
    setHistory(`${previousValue} ${operation} ${display} =`);
    setDisplay(resultString);
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(true);
  }, [display, operation, previousValue]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key >= '0' && e.key <= '9') {
      e.preventDefault();
      inputDigit(e.key);
    } else if (e.key === '.') {
      e.preventDefault();
      inputDecimal();
    } else if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') {
      e.preventDefault();
      performOperation(e.key);
    } else if (e.key === 'Enter' || e.key === '=') {
      e.preventDefault();
      calculate();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      clear();
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      if (display.length > 1) {
        setDisplay(display.slice(0, -1));
      } else {
        setDisplay('0');
      }
    }
  }, [isOpen, inputDigit, inputDecimal, performOperation, calculate, clear, display]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen) return null;

  const fnStyle = { background: 'var(--surface-3)', color: 'var(--t2)' };
  const numStyle = { background: 'var(--surface-2)', color: 'var(--t1)', border: '1px solid var(--border)' };
  const opStyle = { background: 'var(--brand-2)', color: '#fff' };
  const eqStyle = { background: 'var(--t1)', color: 'var(--bg)' };

  const buttons = [
    { label: 'C', action: clear, style: fnStyle },
    { label: 'CE', action: clearEntry, style: fnStyle },
    { label: '%', action: inputPercent, style: fnStyle },
    { label: '+/-', action: toggleSign, style: fnStyle },
    { label: '7', action: () => inputDigit('7'), style: numStyle },
    { label: '8', action: () => inputDigit('8'), style: numStyle },
    { label: '9', action: () => inputDigit('9'), style: numStyle },
    { label: '/', action: () => performOperation('/'), style: opStyle },
    { label: '4', action: () => inputDigit('4'), style: numStyle },
    { label: '5', action: () => inputDigit('5'), style: numStyle },
    { label: '6', action: () => inputDigit('6'), style: numStyle },
    { label: '*', action: () => performOperation('*'), style: opStyle },
    { label: '1', action: () => inputDigit('1'), style: numStyle },
    { label: '2', action: () => inputDigit('2'), style: numStyle },
    { label: '3', action: () => inputDigit('3'), style: numStyle },
    { label: '-', action: () => performOperation('-'), style: opStyle },
    { label: '.', action: inputDecimal, style: numStyle },
    { label: '0', action: () => inputDigit('0'), style: numStyle },
    { label: '=', action: calculate, style: eqStyle },
    { label: '+', action: () => performOperation('+'), style: opStyle },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pointer-events-none">
      <div
        className="w-96 pointer-events-auto"
        style={{
          marginTop: '80px',
          marginRight: '16px',
          background: 'var(--surface)',
          border: '1px solid var(--border-2)',
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <span
            className="font-medium text-lg uppercase"
            style={{ color: 'var(--t1)', fontSize: '11px', letterSpacing: '0.08em' }}
          >
            Calculator
          </span>
          <button
            onClick={onClose}
            className="p-1.5 transition-colors"
            style={{ color: 'var(--t3)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          <div
            className="p-5 mb-5"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
          >
            <div
              className="text-sm h-5 text-right truncate"
              style={{ color: 'var(--t3)' }}
            >
              {history}
            </div>
            <div
              className="text-4xl font-semibold text-right truncate"
              style={{ color: 'var(--t1)' }}
            >
              {display}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {buttons.map((btn, index) => (
              <button
                key={index}
                onClick={btn.action}
                className="h-14 font-medium text-lg transition-opacity hover:opacity-80 active:opacity-60"
                style={btn.style}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
