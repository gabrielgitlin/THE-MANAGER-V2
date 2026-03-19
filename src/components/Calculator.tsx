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

  const buttons = [
    { label: 'C', action: clear, className: 'bg-gray-200 hover:bg-gray-300 text-charcoal' },
    { label: 'CE', action: clearEntry, className: 'bg-gray-200 hover:bg-gray-300 text-charcoal' },
    { label: '%', action: inputPercent, className: 'bg-gray-200 hover:bg-gray-300 text-charcoal' },
    { label: '+/-', action: toggleSign, className: 'bg-gray-200 hover:bg-gray-300 text-charcoal' },
    { label: '7', action: () => inputDigit('7'), className: 'bg-white hover:bg-gray-50 text-charcoal border border-gray-200' },
    { label: '8', action: () => inputDigit('8'), className: 'bg-white hover:bg-gray-50 text-charcoal border border-gray-200' },
    { label: '9', action: () => inputDigit('9'), className: 'bg-white hover:bg-gray-50 text-charcoal border border-gray-200' },
    { label: '/', action: () => performOperation('/'), className: 'bg-primary hover:bg-primary/90 text-white' },
    { label: '4', action: () => inputDigit('4'), className: 'bg-white hover:bg-gray-50 text-charcoal border border-gray-200' },
    { label: '5', action: () => inputDigit('5'), className: 'bg-white hover:bg-gray-50 text-charcoal border border-gray-200' },
    { label: '6', action: () => inputDigit('6'), className: 'bg-white hover:bg-gray-50 text-charcoal border border-gray-200' },
    { label: '*', action: () => performOperation('*'), className: 'bg-primary hover:bg-primary/90 text-white' },
    { label: '1', action: () => inputDigit('1'), className: 'bg-white hover:bg-gray-50 text-charcoal border border-gray-200' },
    { label: '2', action: () => inputDigit('2'), className: 'bg-white hover:bg-gray-50 text-charcoal border border-gray-200' },
    { label: '3', action: () => inputDigit('3'), className: 'bg-white hover:bg-gray-50 text-charcoal border border-gray-200' },
    { label: '-', action: () => performOperation('-'), className: 'bg-primary hover:bg-primary/90 text-white' },
    { label: '.', action: inputDecimal, className: 'bg-white hover:bg-gray-50 text-charcoal border border-gray-200' },
    { label: '0', action: () => inputDigit('0'), className: 'bg-white hover:bg-gray-50 text-charcoal border border-gray-200' },
    { label: '=', action: calculate, className: 'bg-charcoal hover:bg-charcoal/90 text-white' },
    { label: '+', action: () => performOperation('+'), className: 'bg-primary hover:bg-primary/90 text-white' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pointer-events-none">
      <div
        className="bg-white rounded-lg shadow-2xl w-96 pointer-events-auto border border-gray-200"
        style={{ marginTop: '80px', marginRight: '16px' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <span className="font-medium text-charcoal text-lg uppercase">Calculator</span>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5">
          <div className="bg-gray-50 rounded-lg p-5 mb-5">
            <div className="text-sm text-gray-500 h-5 text-right truncate">
              {history}
            </div>
            <div className="text-4xl font-semibold text-charcoal text-right truncate">
              {display}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {buttons.map((btn, index) => (
              <button
                key={index}
                onClick={btn.action}
                className={`h-14 rounded-lg font-medium text-lg transition-colors ${btn.className}`}
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
