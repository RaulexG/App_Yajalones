import { useState } from 'react'
import { CrearChofer } from '../../services/Admin/adminService'

const FormularioChofer = ({ onGuardar }) => {
  const [formulario, setFormulario] = useState({
    name: '',
    phoneNumber: '',
    unidad: { idUnidad: '' },
    enabled: true
  })
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const handleChange = (e) => {
  const { name, value } = e.target;
  if (name === 'idUnidad') {
    setFormulario({
      ...formulario,
      unidad: { idUnidad: parseInt(value) }
    });
  } else {
    setFormulario({ ...formulario, [name]: value });
  }
};

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMensaje('')
    setError('')
    setCargando(true)

    try {
      await CrearChofer(formulario)
      setMensaje('Chofer registrado exitosamente.')
      setFormulario({ name: '', phoneNumber: '', unidad: {idUnidad: ''}, enabled: true })

      if (onGuardar) onGuardar() // refresca la lista desde el padre
    } catch (err) {
      console.error(err)
      setError('Error al registrar al chofer.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {mensaje && <p style={{ color: 'green' }}>{mensaje}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <input name="nombre" value={formulario.nombre} onChange={handleChange} placeholder="Nombre" />
<input name="apellido" value={formulario.apellido} onChange={handleChange} placeholder="Apellido" />
<input name="telefono" value={formulario.telefono} onChange={handleChange} placeholder="Teléfono" />
<input name="idUnidad" value={formulario.unidad.idUnidad} onChange={handleChange} placeholder="ID Unidad" />


      <button type="submit" disabled={cargando}>
        {cargando ? 'Guardando...' : 'Guardar'}
      </button>
    </form>
  )
}

export default FormularioChofer
