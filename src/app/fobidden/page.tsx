export default function ForbiddenPage() {
  return (
    <div className="mx-auto max-w-lg p-6">
      <h1 className="text-xl font-bold">403 - 无权限</h1>
      <p className="mt-2 text-sm text-gray-600">
        你已登录，但不是管理员账号。如需访问后台，请联系管理员为你提升权限。
      </p>
    </div>
  );
}
