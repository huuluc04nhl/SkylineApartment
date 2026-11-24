import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic';

export default async function TodosPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: todos, error } = await supabase.from('todos').select()

  return (
    <div className="min-h-screen bg-[#0A0E17] text-white p-8 font-sans">
      <div className="max-w-2xl mx-auto border border-[#C5A880]/30 p-6 bg-[#121820]">
        <h1 className="text-xl font-bold text-[#C5A880] mb-4">Supabase Todos Demo</h1>
        {error ? (
          <div className="p-4 bg-red-950/50 border border-red-500/50 text-red-300 text-sm mb-4">
            <p className="font-semibold">Lưu ý kết nối Supabase:</p>
            <p>{error.message}</p>
            <p className="text-xs text-gray-400 mt-1">
              (Bảng &apos;todos&apos; cần được tạo trên Supabase Dashboard nếu chưa có).
            </p>
          </div>
        ) : null}
        
        <ul className="space-y-2">
          {todos && todos.length > 0 ? (
            todos.map((todo: any) => (
              <li key={todo.id} className="p-2 border border-gray-700 bg-[#161f2c]">
                {todo.name || todo.title || JSON.stringify(todo)}
              </li>
            ))
          ) : (
            <li className="text-gray-400 text-sm italic">
              Không có dữ liệu trong bảng todos hoặc bảng chưa có bản ghi.
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}
